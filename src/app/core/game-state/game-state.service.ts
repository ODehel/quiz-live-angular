import { signal } from '@angular/core';
import { Observable } from 'rxjs';
import { messageType } from '../websocket/message-type';
import { OutboundMessage } from '../websocket/websocket.service';

export type Phase = 'setup' | 'lobby' | 'playing' | 'results' | 'error';

export interface HubChannel {
    readonly messages$: Observable<string>;
    send(message: OutboundMessage): void;
}

export class GameStateService {
    readonly state = signal<{ phase: Phase }>({ phase: 'setup' });

    constructor(private readonly hub: HubChannel) {
        hub.messages$.subscribe(data => {
            if (messageType(data) === 'auth_success') this.requestSync();
        });
    }

    requestSync(): void {
        this.hub.send({ type: 'request_game_state' });
    }

    transitionTo(phase: Phase): void {
        this.state.set({ phase });
    }
}
