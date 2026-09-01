import { Signal } from "@angular/core";
import { Observable, Subject } from "rxjs";

export interface TokenProvider {
  readonly token: Signal<string | null>;
}

export interface SocketLike {
  onmessage: ((event: MessageEvent) => void) | null;
  onclose: ((event: CloseEvent) => void) | null;
  send(message: string): void;
}

type WebSocketCtor = new (url: string) => SocketLike;

export class WebSocketService {
  private readonly _messages$ = new Subject<string>();
  readonly messages$: Observable<string> = this._messages$.asObservable();

  constructor(
    private readonly webSocketConstructor: WebSocketCtor,
    private readonly wsUrl: string,
    private readonly tokenProvider: TokenProvider
  ) { }

  connect(): void {
    const websocket = new this.webSocketConstructor(this.wsUrl);

    websocket.onmessage = (event) => {
      this._messages$.next(event.data);
    };
    websocket.onclose = (event) => {
      this.connect();
    };

    websocket.send(JSON.stringify({ type: 'auth', token: this.tokenProvider.token() }));
  }
}