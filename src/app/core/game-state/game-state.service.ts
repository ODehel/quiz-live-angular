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
    private readonly buzzers = signal<string[]>([]);
    readonly connectedBuzzers = this.buzzers.asReadonly();

    constructor(private readonly hub: HubChannel) {
        hub.messages$.subscribe(data => {
            const type = messageType(data);
            if (type === 'auth_success') this.requestSync();
            if (type === 'game_state_sync') this.replaceBuzzers(JSON.parse(data).connected_buzzers);
            if (type === 'buzzer_connected' || type === 'buzzer_disconnected') {
                const username = usernameOf(data);
                if (username === undefined) return;
                if (type === 'buzzer_connected') this.addBuzzer(username);
                else this.removeBuzzer(username);
            }
        });
    }

    private addBuzzer(username: string): void {
        this.buzzers.update(list => (list.includes(username) ? list : [...list, username]));
    }

    private removeBuzzer(username: string): void {
        this.buzzers.update(list =>
            list.includes(username) ? list.filter(listed => listed !== username) : list,
        );
    }

    private replaceBuzzers(usernames: unknown): void {
        if (!isStringList(usernames)) return;
        this.buzzers.update(list => (sameList(list, usernames) ? list : usernames));
    }

    requestSync(): void {
        this.hub.send({ type: 'request_game_state' });
    }

    transitionTo(phase: Phase): void {
        this.state.set({ phase });
    }
}

function usernameOf(data: string): string | undefined {
    const { username } = JSON.parse(data);
    return typeof username === 'string' ? username : undefined;
}

function isStringList(value: unknown): value is string[] {
    return Array.isArray(value) && value.every(item => typeof item === 'string');
}

function sameList(left: string[], right: string[]): boolean {
    return left.length === right.length && left.every((item, index) => item === right[index]);
}
