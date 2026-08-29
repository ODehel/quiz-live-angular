import { Signal } from "@angular/core";

export interface TokenProvider {
  readonly token: Signal<string | null>;
}

export interface SocketLike {
  send(message: string): void;
}

type WebSocketCtor = new (url: string) => SocketLike;

export class WebSocketService {
  constructor(
    private readonly webSocketConstructor: WebSocketCtor,
    private readonly wsUrl: string,
    private readonly tokenProvider: TokenProvider
  ) {}

  connect(): void {
    const websocket = new this.webSocketConstructor(this.wsUrl);
    websocket.send(JSON.stringify({ type: 'auth', token: this.tokenProvider.token() }));
  }
}