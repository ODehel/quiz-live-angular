import type { SocketLike } from './websocket.service';

/**
 * Doublure de socket partagée par les specs du WebSocket (service, câblage).
 * Enregistre ce que le code lui envoie ; ne simule rien d'elle-même : `close()` note l'appel
 * et n'enchaîne PAS `onclose` (voir DEBTS.md, « FakeSocket.close() n'appelle pas onclose »).
 * Pour une fermeture qui enchaîne `onclose`, voir `ClosingFakeSocket`.
 */
export class FakeSocket implements SocketLike {
  static instances: FakeSocket[] = [];

  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  readonly sent: string[] = [];
  readonly closes: { code?: number; reason?: string }[] = [];

  constructor(public readonly url: string) {
    FakeSocket.instances.push(this);
  }

  /** Dernier message envoyé, `undefined` tant que rien n'est parti. */
  get sentMessage(): string | undefined {
    return this.sent[this.sent.length - 1];
  }

  get closeCalls(): number {
    return this.closes.length;
  }

  send(message: string): void {
    this.sent.push(message);
  }

  close(code?: number, reason?: string): void {
    this.closes.push({ code, reason });
  }

  simulateOpen(): void {
    this.onopen?.(new Event('open'));
  }

  simulateMessage(data: string): void {
    this.onmessage?.(new MessageEvent('message', { data }));
  }

  simulateClose(code = 1000): void {
    this.onclose?.(new CloseEvent('close', { code }));
  }
}

/**
 * Variante de `FakeSocket` dont `close()` enchaîne `onclose`, comme le fait un navigateur
 * (code 1000 par défaut). Utilisée par la spec du service, qui prouve la reconnexion
 * déclenchée par ses propres fermetures.
 */
export class ClosingFakeSocket extends FakeSocket {
  override close(code?: number, reason?: string): void {
    super.close(code, reason);
    this.simulateClose(code ?? 1000);
  }
}

/**
 * Doublure inerte : n'enregistre rien et n'a pas de `close()` (un appel lèverait une erreur).
 * Pour les specs qui ne portent pas sur la socket (voir app.config.websocket.spec.ts pour celles qui le font).
 */
export class InertSocket {
  onopen = null;
  onmessage = null;
  onclose = null;
  send(): void { }
}
