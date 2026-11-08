#!/usr/bin/env node
// Faux hub pour le smoke test du refresh du token (US-ANG-001, CA-12 et CA-13).
//
// Il remplace le vrai hub, qui n'implemente pas US-021 (ni `token_expiring_soon`, ni `auth_refresh`).
// Il prouve le cablage cote Angular (vraie socket, vrai AuthService, vrai intercepteur), PAS le vrai hub :
// le comportement joue ici est la lecture de la spec US-021 par Claude.
//
// Usage (depuis la racine du depot, arreter le vrai hub d'abord, il occupe aussi le port 3000) :
//   node scripts/fake-hub.mjs                    # scenario nominal
//   node scripts/fake-hub.mjs --fail-refresh     # le 2e POST /api/v1/token echoue (503)
//   options : --port 3000  --expiring-after 10 (s)  --verdict-timeout 20 (s)  --out smoke-test-summary.txt
//
// Le script s'arrete tout seul avec un verdict (code 0 = PASS, 1 = FAIL) et ecrit son compte rendu dans --out.
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] !== undefined ? args[index + 1] : fallback;
};

const port = Number(option('port', '3000'));
const expiringAfterMs = Number(option('expiring-after', '10')) * 1000;
const verdictTimeoutMs = Number(option('verdict-timeout', '20')) * 1000;
const outFile = option('out', 'smoke-test-summary.txt');
const failRefresh = flag('fail-refresh');
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

fs.writeFileSync(outFile, '');
const log = (text) => {
  const line = `${new Date().toISOString()} ${text}`;
  console.log(line);
  fs.appendFileSync(outFile, `${line}\n`);
};

let issued = 0; // nombre de POST /api/v1/token recus
let lastToken = null; // dernier token emis avec succes
let connections = 0; // nombre de connexions WebSocket ouvertes
let expiringSentAt = null;
let refreshReceived = null; // { token, connection }
let finished = false;

const verdict = (ok, why) => {
  if (finished) return;
  finished = true;
  log(`[${ok ? 'PASS' : 'FAIL'}] ${why}`);
  setTimeout(() => process.exit(ok ? 0 : 1), 200);
};

const evaluate = () => {
  if (expiringSentAt === null) return verdict(false, 'token_expiring_soon n\'a jamais ete envoye (le client ne s\'est pas authentifie ?)');
  if (failRefresh) {
    if (refreshReceived !== null) return verdict(false, `auth_refresh recu alors que le refresh a echoue (token ${refreshReceived.token})`);
    if (issued < 2) return verdict(false, 'aucun 2e POST /api/v1/token : le client n\'a pas tente de refresh');
    return verdict(true, 'refresh tente (2e POST en 503) et aucun auth_refresh envoye');
  }
  if (refreshReceived === null) return verdict(false, 'aucun auth_refresh recu apres token_expiring_soon');
  if (refreshReceived.token !== lastToken) return verdict(false, `auth_refresh porte "${refreshReceived.token}", attendu le dernier token emis "${lastToken}"`);
  if (connections !== 1) return verdict(false, `${connections} connexions WebSocket ouvertes : la connexion existante n'a pas ete conservee`);
  return verdict(true, `auth_refresh recu avec le nouveau token (${lastToken}) sur la connexion existante`);
};

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/v1/token') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      issued++;
      let username = '?';
      try { username = JSON.parse(body).username; } catch { /* corps ignore */ }
      if (failRefresh && issued >= 2) {
        log(`POST /api/v1/token #${issued} (${username}) -> 503 (echec voulu)`);
        res.writeHead(503, { 'content-type': 'application/json' }).end('{"error":"fake"}');
        return;
      }
      lastToken = `fake-token-${issued}`;
      log(`POST /api/v1/token #${issued} (${username}) -> 200 ${lastToken}`);
      res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ token: lastToken }));
    });
    return;
  }
  log(`${req.method} ${req.url} -> 404`);
  res.writeHead(404).end();
});

// --- WebSocket minimal (RFC 6455) : trames texte client -> serveur masquees, longueur < 64 Ko.
const frame = (text) => {
  const payload = Buffer.from(text);
  const header = payload.length < 126
    ? Buffer.from([0x81, payload.length])
    : Buffer.from([0x81, 126, payload.length >> 8, payload.length & 0xff]);
  return Buffer.concat([header, payload]);
};

server.on('upgrade', (req, socket) => {
  if (req.url !== '/ws') { socket.destroy(); return; }
  const key = req.headers['sec-websocket-key'];
  const accept = crypto.createHash('sha1').update(key + GUID).digest('base64');
  socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
  const connection = ++connections;
  log(`WS #${connection} ouverte`);
  let buffer = Buffer.alloc(0);
  const send = (message) => { log(`WS #${connection} -> ${JSON.stringify(message)}`); socket.write(frame(JSON.stringify(message))); };

  const onText = (text) => {
    log(`WS #${connection} <- ${text}`);
    let message;
    try { message = JSON.parse(text); } catch { return; }
    if (message.type === 'auth') {
      send({ type: 'auth_success', username: 'admin', role: 'admin', expires_in: 3600 });
      setTimeout(() => {
        expiringSentAt = Date.now();
        send({ type: 'token_expiring_soon', expires_in: 300 });
        setTimeout(evaluate, verdictTimeoutMs);
      }, expiringAfterMs);
    } else if (message.type === 'auth_refresh') {
      refreshReceived = { token: message.token, connection };
      send({ type: 'auth_success', username: 'admin', role: 'admin', expires_in: 3600 });
      setTimeout(evaluate, 500);
    }
  };

  socket.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    while (buffer.length >= 2) {
      const opcode = buffer[0] & 0x0f;
      let length = buffer[1] & 0x7f;
      let offset = 2;
      if (length === 126) { if (buffer.length < 4) return; length = buffer.readUInt16BE(2); offset = 4; }
      if (length === 127) { socket.destroy(); return; }
      if (buffer.length < offset + 4 + length) return;
      const mask = buffer.subarray(offset, offset + 4);
      const payload = Buffer.from(buffer.subarray(offset + 4, offset + 4 + length));
      for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i % 4];
      buffer = buffer.subarray(offset + 4 + length);
      if (opcode === 1) onText(payload.toString('utf8'));
      else if (opcode === 8) { socket.end(Buffer.from([0x88, 0x00])); return; }
      else if (opcode === 9) socket.write(Buffer.concat([Buffer.from([0x8a, payload.length]), payload]));
    }
  });
  socket.on('close', () => log(`WS #${connection} fermee`));
  socket.on('error', () => { /* fermeture brutale du navigateur : sans importance */ });
});

server.on('error', (error) => {
  log(`[FAIL] le serveur n'a pas demarre : ${error.message}${error.code === 'EADDRINUSE' ? ' (le vrai hub tourne-t-il encore sur ce port ?)' : ''}`);
  process.exit(1);
});

server.listen(port, () => {
  log(`Faux hub sur http://localhost:${port} (${failRefresh ? 'refresh en echec voulu' : 'scenario nominal'}), token_expiring_soon ${expiringAfterMs / 1000} s apres auth_success`);
  log('Lancer maintenant `npm start` et ouvrir http://localhost:4200 ; le verdict s\'affichera ici.');
});
