import { Injectable, signal } from "@angular/core";

export interface ErrorContext {
  variant: 'not-found' | 'connection-lost' | 'server-error' | 'game-corrupted';
}

@Injectable({ providedIn: 'root' })
export class ErrorService {
  readonly currentError = signal<ErrorContext | null>(null);

  private setError(variant: ErrorContext['variant']): void {
    this.currentError.set({ variant });
  }

  notFound(): void { this.setError('not-found'); }
  connectionLost(): void { this.setError('connection-lost'); }
  serverError(): void { this.setError('server-error'); }
  gameCorrupted(): void { this.setError('game-corrupted'); }
  clearError(): void { this.currentError.set(null); }
}