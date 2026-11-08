import { Injectable, signal } from "@angular/core";

export interface ErrorContext {
  variant: 'not-found' | 'connection-lost' | 'server-error' | 'game-corrupted' | 'invalid-credentials' | 'session-replaced';
}

@Injectable({ providedIn: 'root' })
export class ErrorService {
  readonly currentError = signal<ErrorContext | null>(null);

  private setError(variant: ErrorContext['variant']): void {
    this.currentError.set({ variant });
  }

  notFound(): void { this.setError('not-found'); }
  connectionLost(): void { this.setError('connection-lost'); }
  invalidCredentials(): void { this.setError('invalid-credentials'); }
  serverError(): void { this.setError('server-error'); }
  gameCorrupted(): void { this.setError('game-corrupted'); }
  sessionReplaced(): void { this.setError('session-replaced'); }
  clearError(): void { this.currentError.set(null); }
}