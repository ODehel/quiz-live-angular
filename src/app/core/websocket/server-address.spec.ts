import { serverAddress } from './server-address';

describe('serverAddress', () => {
  it('keeps the host and the port, without scheme nor path', () => {
    expect(serverAddress('ws://localhost:3000/ws')).toBe('localhost:3000');
  });

  it('keeps the host and the port of an IP address', () => {
    expect(serverAddress('ws://192.168.1.10:3000/ws')).toBe('192.168.1.10:3000');
  });

  it('keeps the host alone when the URL has no port', () => {
    expect(serverAddress('ws://h/ws')).toBe('h');
  });

  it('keeps the host alone when the port is the default one of ws', () => {
    expect(serverAddress('ws://h:80/ws')).toBe('h');
  });

  it('keeps the host alone when the port is the default one of wss', () => {
    expect(serverAddress('wss://h:443/ws')).toBe('h');
  });

  it('keeps the port 443 on ws, where it is not the default one', () => {
    expect(serverAddress('ws://h:443/ws')).toBe('h:443');
  });

  it('keeps the port 80 on wss, where it is not the default one', () => {
    expect(serverAddress('wss://h:80/ws')).toBe('h:80');
  });

  it('keeps the host alone for the neutral production address', () => {
    expect(serverAddress('wss://set-by-ci.invalid/ws')).toBe('set-by-ci.invalid');
  });

  it('keeps the brackets and the port of an IPv6 address', () => {
    expect(serverAddress('ws://[::1]:3000/ws')).toBe('[::1]:3000');
  });

  it('does not reveal credentials written in the URL', () => {
    expect(serverAddress('ws://user:secret@h:3000/ws')).toBe('h:3000');
  });

  it.each([
    ['not a url'],
    [''],
    ['/ws'],
    ['ws://'],
    ['localhost:3000'],
    ['localhost:3000/ws'],
  ])('returns the raw value as is when %j is not a usable URL', (wsUrl) => {
    expect(serverAddress(wsUrl)).toBe(wsUrl);
  });
});
