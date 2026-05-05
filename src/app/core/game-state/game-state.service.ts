import { Injectable, signal } from '@angular/core';

export type Phase = 'setup' | 'lobby' | 'playing' | 'results' | 'error';
@Injectable({ providedIn: 'root' })
export class GameStateService {
    readonly state = signal<{ phase: Phase }>({ phase: 'setup' });
    transitionTo(phase: Phase): void {
        this.state.set({ phase });
    }
}