import { Observable, Subject } from "rxjs";

export interface TokenProvider {
  getToken(): string | null;
  refresh(): Promise<void>;
}

export interface ErrorNavigator {
  goToError(): void;
}
export interface SocketLike {
  onopen: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent) => void) | null;
  onclose: ((event: CloseEvent) => void) | null;
  send(message: string): void;
}

export type WebSocketCtor =new (url: string) => SocketLike;

export class WebSocketService {
  private attempt: number = 0;
  private readonly _messages$ = new Subject<string>();
  readonly messages$: Observable<string> = this._messages$.asObservable();

  constructor(
    private readonly webSocketConstructor: WebSocketCtor,
    private readonly wsUrl: string,
    private readonly tokenProvider: TokenProvider,
    private readonly errorNavigator: ErrorNavigator
  ) { }

  connect(): void {
    const websocket = new this.webSocketConstructor(this.wsUrl);

    websocket.onmessage = (event) => {
      this._messages$.next(event.data);
      if (this.isAuthSuccess(event.data)) this.attempt = 0;
      if (this.isTokenExpiringSoon(event.data)) {
        this.tokenProvider.refresh()
          .then(() => websocket.send(this.tokenMessage('auth_refresh')))
          .catch(() => { /* échec ignoré : relances = CA-15 */ });
      }
    };
    websocket.onclose = async (event) => {
      if (event.code === 4004) {
        this.errorNavigator.goToError();
        return;
      }
      if (event.code === 4002) {
        try {
          await this.tokenProvider.refresh();
        } catch {
          // Refresh échoué : on reconnecte quand même, avec le token courant.
        }
      }
      setTimeout(() => this.connect(), this.backOffDelay(this.attempt));
      this.attempt++;
    };

    websocket.onopen = () => {
      websocket.send(this.tokenMessage('auth'));
    };
  }

  private tokenMessage(type: 'auth' | 'auth_refresh'): string {
    return JSON.stringify({ type, token: this.tokenProvider.getToken() });
  }

  private isAuthSuccess(data: string): boolean {
    return this.messageType(data) === 'auth_success';
  }

  private isTokenExpiringSoon(data: string): boolean {
    return this.messageType(data) === 'token_expiring_soon';
  }

  private messageType(data: string): unknown {
    try {
      return JSON.parse(data).type;
    } catch {
      return undefined;
    }
  }

  private backOffDelay(attempt: number): number {
    return Math.min(Math.pow(2, attempt) * 1000, 30000);
  }
}