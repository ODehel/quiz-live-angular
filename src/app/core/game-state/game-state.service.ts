import { Injectable, signal } from '@angular/core';

export type Phase = 'setup' | 'lobby' | 'playing' | 'results' | 'error';


export class GameStateService {
    readonly state = signal<{ phase: Phase }>({ phase: 'setup' });
@Injectable({ providedIn: 'root' })
    transitionTo(phase: Phase): void {
        this.state.set({ phase });
    }
}