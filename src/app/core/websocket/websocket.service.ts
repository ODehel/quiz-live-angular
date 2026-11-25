import { signal } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { messageType } from "./message-type";

export interface TokenProvider {
  getToken(): string | null;
  refresh(): Promise<void>;
}

export type ErrorCause = 'session-replaced' | 'connection-lost';

export interface ErrorNavigator {
  goToError(cause: ErrorCause): void;
}
export interface SocketLike {
  onopen: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent) => void) | null;
  onclose: ((event: CloseEvent) => void) | null;
  send(message: string): void;
  close(code?: number, reason?: string): void;
}

export type OutboundMessage = { readonly type: 'request_game_state' };

export type WebSocketCtor =new (url: string) => SocketLike;

const REFRESH_MAX_ATTEMPTS = 3;
const REFRESH_RETRY_DELAY_MS = 5000;

export class WebSocketService {
  private attempt: number = 0;
  private readonly closedSockets = new WeakSet<SocketLike>();
  private currentSocket?: SocketLike;
  private readonly _messages$ = new Subject<string>();
  readonly messages$: Observable<string> = this._messages$.asObservable();
  private readonly _isConnected = signal(false);
  private readonly _isReconnecting = signal(false);
  private readonly _isDisconnected = signal(false);
  readonly isConnected = this._isConnected.asReadonly();
  readonly isReconnecting = this._isReconnecting.asReadonly();
  readonly isDisconnected = this._isDisconnected.asReadonly();

  constructor(
    private readonly webSocketConstructor: WebSocketCtor,
    private readonly wsUrl: string,
    private readonly tokenProvider: TokenProvider,
    private readonly errorNavigator: ErrorNavigator
  ) { }

  connect(): void {
    this._isReconnecting.set(true);
    let websocket: SocketLike;
    try {
      websocket = new this.webSocketConstructor(this.wsUrl);
    } catch {
      // Cause permanente (adresse invalide) : page d'erreur, aucune reprise.
      this.currentSocket = undefined;
      this._isReconnecting.set(false);
      this._isDisconnected.set(true);
      this.errorNavigator.goToError('connection-lost');
      return;
    }
    this.currentSocket = websocket;

    websocket.onmessage = (event) => {
      this._messages$.next(event.data);
      if (this.isAuthSuccess(event.data)) {
        this.attempt = 0;
        this._isConnected.set(true);
        this._isReconnecting.set(false);
      }
      if (this.isTokenExpiringSoon(event.data)) {
        this.refreshAndSend(websocket);
      }
    };
    websocket.onclose = async (event) => {
      this.closedSockets.add(websocket);
      this._isConnected.set(false);
      if (event.code === 4004) {
        this._isReconnecting.set(false);
        this.errorNavigator.goToError('session-replaced');
        return;
      }
      this._isReconnecting.set(true);
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

  send(message: OutboundMessage): void {
    this.currentSocket?.send(JSON.stringify(message));
  }

  private refreshAndSend(websocket: SocketLike, attempt: number = 1): void {
    if (this.isClosed(websocket)) return;
    this.tokenProvider.refresh()
      .then(() => {
        if (!this.isClosed(websocket)) websocket.send(this.tokenMessage('auth_refresh'));
      })
      .catch(() => {
        if (this.isClosed(websocket)) return;
        if (attempt < REFRESH_MAX_ATTEMPTS) {
          setTimeout(() => this.refreshAndSend(websocket, attempt + 1), REFRESH_RETRY_DELAY_MS);
        } else {
          websocket.close(1000, 'Token refresh failed');
        }
      });
  }

  private isClosed(websocket: SocketLike): boolean {
    return this.closedSockets.has(websocket);
  }

  private tokenMessage(type: 'auth' | 'auth_refresh'): string {
    return JSON.stringify({ type, token: this.tokenProvider.getToken() });
  }

  private isAuthSuccess(data: string): boolean {
    return messageType(data) === 'auth_success';
  }

  private isTokenExpiringSoon(data: string): boolean {
    return messageType(data) === 'token_expiring_soon';
  }

  private backOffDelay(attempt: number): number {
    return Math.min(Math.pow(2, attempt) * 1000, 30000);
  }
}