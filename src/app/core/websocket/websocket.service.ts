import { Signal } from "@angular/core";
import { Observable, Subject } from "rxjs";

export interface TokenProvider {
  readonly token: Signal<string | null>;
  refresh(): Promise<void>;
}

export interface SocketLike {
  onmessage: ((event: MessageEvent) => void) | null;
  onclose: ((event: CloseEvent) => void) | null;
  send(message: string): void;
}

type WebSocketCtor = new (url: string) => SocketLike;

export class WebSocketService {
  private attempt: number = 0;
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
    websocket.onclose = async (event) => {
      if (event.code === 4002) await this.tokenProvider.refresh();
      setTimeout(() => this.connect(), this.backOffDelay(this.attempt));
      this.attempt++;
    };

    websocket.send(JSON.stringify({ type: 'auth', token: this.tokenProvider.token() }));
  }

  private backOffDelay(attempt: number): number {
    return Math.min(Math.pow(2, attempt) * 1000, 30000);
  }
}