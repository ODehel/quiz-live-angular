import { signal } from '@angular/core';
import { Observable } from 'rxjs';
import { messageType } from '../websocket/message-type';
import { OutboundMessage } from '../websocket/websocket.service';

export type GameStatus =
    | 'PENDING'
    | 'OPEN'
    | 'QUESTION_TITLE'
    | 'QUESTION_OPEN'
    | 'QUESTION_BUZZED'
    | 'QUESTION_CLOSED'
    | 'COMPLETED'
    | 'IN_ERROR';

export interface ParticipantState {
    order: number;
    name: string;
    cumulative_score: number;
}

export interface GameState {
    phase: Phase;
    gameId: string | null;
    status: GameStatus | null;
    questionIndex: number | null;
    quizId: string | null;
    participants: ParticipantState[];
    startedAt: string | null;
    timeLimit: number | null;
}

export type Phase = 'setup' | 'lobby' | 'playing' | 'results' | 'error';

export interface HubChannel {
    readonly messages$: Observable<string>;
    send(message: OutboundMessage): void;
}

export class GameStateService {
    readonly state = signal<GameState>({
        phase: 'setup',
        gameId: null,
        status: null,
        questionIndex: null,
        quizId: null,
        participants: [],
        startedAt: null,
        timeLimit: null,
    });
    private readonly buzzers = signal<string[]>([]);
    readonly connectedBuzzers = this.buzzers.asReadonly();
    private readonly known = signal(false);
    readonly buzzersKnown = this.known.asReadonly();

    constructor(private readonly hub: HubChannel) {
        hub.messages$.subscribe(data => {
            const type = messageType(data);
            if (type === 'auth_success') this.requestSync();
            if (type === 'game_state_sync') this.dispatch(JSON.parse(data));
            if (type === 'buzzer_connected' || type === 'buzzer_disconnected') {
                const username = usernameOf(data);
                if (username === undefined) return;
                if (type === 'buzzer_connected') this.addBuzzer(username);
                else this.removeBuzzer(username);
            }
        });
    }

    private dispatch(sync: Record<string, unknown>): void {
        if (!GAME_FIELDS.some(field => Object.hasOwn(sync, field))) {
            this.replaceBuzzers(sync['connected_buzzers']);
            return;
        }
        if (!isFullSync(sync)) return;
        this.state.update(state => ({
            ...state,
            gameId: sync.game_id,
            status: sync.status,
            questionIndex: sync.question_index,
            quizId: sync.quiz_id,
            participants: sync.participants,
            startedAt: sync.started_at ?? null,
            timeLimit: sync.time_limit ?? null,
        }));
        this.replaceBuzzers(sync.connected_buzzers);
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
        this.known.set(true);
        this.buzzers.update(list => (sameList(list, usernames) ? list : usernames));
    }

    requestSync(): void {
        this.hub.send({ type: 'request_game_state' });
    }

    transitionTo(phase: Phase): void {
        this.state.update(state => ({ ...state, phase }));
    }
}

const GAME_FIELDS = [
    'game_id',
    'status',
    'question_index',
    'quiz_id',
    'participants',
    'started_at',
    'time_limit',
];

const GAME_STATUSES: readonly unknown[] = [
    'PENDING',
    'OPEN',
    'QUESTION_TITLE',
    'QUESTION_OPEN',
    'QUESTION_BUZZED',
    'QUESTION_CLOSED',
    'COMPLETED',
    'IN_ERROR',
] satisfies GameStatus[];

interface FullSync {
    game_id: string;
    status: GameStatus;
    question_index: number;
    quiz_id: string;
    participants: ParticipantState[];
    connected_buzzers: string[];
    started_at?: string;
    time_limit?: number;
}

function isFullSync(sync: Record<string, unknown>): sync is Record<string, unknown> & FullSync {
    return (
        typeof sync['game_id'] === 'string' &&
        GAME_STATUSES.includes(sync['status']) &&
        typeof sync['question_index'] === 'number' &&
        typeof sync['quiz_id'] === 'string' &&
        isParticipantList(sync['participants']) &&
        isStringList(sync['connected_buzzers']) &&
        isOptional(sync['started_at'], 'string') &&
        isOptional(sync['time_limit'], 'number')
    );
}

function isOptional(value: unknown, type: 'string' | 'number'): boolean {
    return value === undefined || typeof value === type;
}

function isParticipantList(value: unknown): value is ParticipantState[] {
    return (
        Array.isArray(value) &&
        value.every(
            item =>
                typeof item === 'object' &&
                item !== null &&
                typeof item.order === 'number' &&
                typeof item.name === 'string' &&
                typeof item.cumulative_score === 'number',
        )
    );
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
