import { config, Subject } from 'rxjs';
import { GameStateService } from './game-state.service'
import { OutboundMessage } from '../websocket/websocket.service';
import { fullSync } from './game-state.test-helpers';

const fullSyncJson = (changes: Record<string, unknown> = {}): string => JSON.stringify(fullSync(changes));

const settle = (): Promise<void> => new Promise(resolve => setTimeout(resolve));

describe('GameStateService', () => {
    let service: GameStateService;
    let unhandledErrors: unknown[];
    let incoming: Subject<string>;
    let hub: { messages$: Subject<string>; send: ReturnType<typeof vi.fn<(message: OutboundMessage) => void>> };

    beforeEach(() => {
        unhandledErrors = [];
        config.onUnhandledError = error => unhandledErrors.push(error);
        incoming = new Subject<string>();
        hub = { messages$: incoming, send: vi.fn<(message: OutboundMessage) => void>() };
        service = new GameStateService(hub);
    });
    afterEach(async () => {
        await settle();
        config.onUnhandledError = null;

        expect(unhandledErrors).toEqual([]);
    });
    it('should have setup as initial phase', () => {
        expect(service.state().phase).toBe('setup');
    });
    it('should change of state', () => {
        service.transitionTo('lobby');

        expect(service.state().phase).toBe('lobby');
    });
    it('should ask the hub for the game state when the hub accepts the session', () => {
        incoming.next('{"type":"auth_success"}');

        expect(hub.send).toHaveBeenCalledWith({ type: 'request_game_state' });
    });
    it('should keep listening after a message that is not JSON', () => {
        incoming.next('not json');
        incoming.next('{"type":"auth_success"}');

        expect(hub.send).toHaveBeenCalledTimes(1);
    });
    it('should ask the hub once per accepted session, including the one that follows a token refresh', () => {
        incoming.next('{"type":"auth_success"}');
        incoming.next('{"type":"auth_success"}');

        expect(hub.send).toHaveBeenCalledTimes(2);
    });
    it('should not ask the hub for the game state before the hub accepts the session', () => {
        expect(hub.send).not.toHaveBeenCalled();
    });
    it.each([
        '{"type":"token_expiring_soon"}',
        '{"type":"game_state_sync"}',
        '{"type":"buzzer_connected","username":"quiz_buzzer_01"}',
        '{"username":"auth_success"}',
        'null',
    ])('should not ask the hub for the game state on %s', (data) => {
        incoming.next(data);

        expect(hub.send).not.toHaveBeenCalled();
    });
    it('should have no connected buzzer initially', () => {
        expect(service.connectedBuzzers()).toEqual([]);
    });
    it('should add a buzzer that connects', () => {
        incoming.next('{"type":"buzzer_connected","username":"quiz_buzzer_01"}');

        expect(service.connectedBuzzers()).toEqual(['quiz_buzzer_01']);
    });
    it('should add the buzzers that connect at the end of the list, in arrival order', () => {
        incoming.next('{"type":"buzzer_connected","username":"quiz_buzzer_02"}');
        incoming.next('{"type":"buzzer_connected","username":"quiz_buzzer_01"}');
        incoming.next('{"type":"buzzer_connected","username":"quiz_buzzer_03"}');

        expect(service.connectedBuzzers()).toEqual(['quiz_buzzer_02', 'quiz_buzzer_01', 'quiz_buzzer_03']);
    });
    it('should list a buzzer once and keep its rank when its connection is announced again', () => {
        incoming.next('{"type":"buzzer_connected","username":"quiz_buzzer_01"}');
        incoming.next('{"type":"buzzer_connected","username":"quiz_buzzer_02"}');
        incoming.next('{"type":"buzzer_connected","username":"quiz_buzzer_01"}');

        expect(service.connectedBuzzers()).toEqual(['quiz_buzzer_01', 'quiz_buzzer_02']);
    });
    it('should remove only the buzzer that disconnects', () => {
        incoming.next('{"type":"buzzer_connected","username":"quiz_buzzer_01"}');
        incoming.next('{"type":"buzzer_connected","username":"quiz_buzzer_02"}');
        incoming.next('{"type":"buzzer_connected","username":"quiz_buzzer_03"}');

        incoming.next('{"type":"buzzer_disconnected","username":"quiz_buzzer_02"}');

        expect(service.connectedBuzzers()).toEqual(['quiz_buzzer_01', 'quiz_buzzer_03']);
    });
    it('should leave the list as it is, without asking the hub, when a buzzer that is not listed disconnects', () => {
        incoming.next('{"type":"buzzer_connected","username":"quiz_buzzer_01"}');

        incoming.next('{"type":"buzzer_disconnected","username":"quiz_buzzer_02"}');

        expect(service.connectedBuzzers()).toEqual(['quiz_buzzer_01']);
        expect(hub.send).not.toHaveBeenCalled();
    });
    it('should put the buzzer at the end of the list when it reconnects after having disconnected', () => {
        incoming.next('{"type":"buzzer_connected","username":"quiz_buzzer_01"}');
        incoming.next('{"type":"buzzer_connected","username":"quiz_buzzer_02"}');
        incoming.next('{"type":"buzzer_disconnected","username":"quiz_buzzer_01"}');
        incoming.next('{"type":"buzzer_connected","username":"quiz_buzzer_01"}');

        expect(service.connectedBuzzers()).toEqual(['quiz_buzzer_02', 'quiz_buzzer_01']);
    });
    it.each([
        '{"type":"auth_success"}',
        '{"type":"buzzer_buzzed","username":"quiz_buzzer_01"}',
        'not json',
    ])('should not change the connected buzzers on %s', (data) => {
        incoming.next('{"type":"buzzer_connected","username":"quiz_buzzer_01"}');

        incoming.next(data);

        expect(service.connectedBuzzers()).toEqual(['quiz_buzzer_01']);
    });
    it('should replace the connected buzzers with those of a game_state_sync, in its order', () => {
        incoming.next('{"type":"buzzer_connected","username":"quiz_buzzer_01"}');
        incoming.next('{"type":"buzzer_connected","username":"quiz_buzzer_02"}');

        incoming.next('{"type":"game_state_sync","connected_buzzers":["quiz_buzzer_03","quiz_buzzer_01"]}');

        expect(service.connectedBuzzers()).toEqual(['quiz_buzzer_03', 'quiz_buzzer_01']);
    });
    it('should empty the connected buzzers when a game_state_sync lists none', () => {
        incoming.next('{"type":"buzzer_connected","username":"quiz_buzzer_01"}');

        incoming.next('{"type":"game_state_sync","connected_buzzers":[]}');

        expect(service.connectedBuzzers()).toEqual([]);
    });
    it('should keep the connected buzzers when a game_state_sync does not carry them', () => {
        incoming.next('{"type":"buzzer_connected","username":"quiz_buzzer_01"}');

        incoming.next('{"type":"game_state_sync"}');

        expect(service.connectedBuzzers()).toEqual(['quiz_buzzer_01']);
    });
    it.each([
        '{"type":"game_state_sync","connected_buzzers":null}',
        '{"type":"game_state_sync","connected_buzzers":"quiz_buzzer_09"}',
        '{"type":"game_state_sync","connected_buzzers":{"0":"quiz_buzzer_09"}}',
        '{"type":"game_state_sync","connected_buzzers":[{"username":"quiz_buzzer_09"}]}',
        '{"type":"game_state_sync","connected_buzzers":["quiz_buzzer_09",42]}',
        '{"type":"game_state_sync","connected_buzzers":["quiz_buzzer_09",null]}',
    ])('should reject the whole game_state_sync, leaving the connected buzzers as they are, on %s', (data) => {
        incoming.next('{"type":"buzzer_connected","username":"quiz_buzzer_01"}');
        const before = service.connectedBuzzers();

        expect(() => incoming.next(data)).not.toThrow();

        expect(service.connectedBuzzers()).toBe(before);
    });
    it('should keep listening after rejecting a game_state_sync', () => {
        incoming.next('{"type":"game_state_sync","connected_buzzers":[{"username":"quiz_buzzer_09"}]}');
        incoming.next('{"type":"buzzer_connected","username":"quiz_buzzer_01"}');

        expect(service.connectedBuzzers()).toEqual(['quiz_buzzer_01']);
    });
    it('should not notify anyone when a game_state_sync lists the buzzers already connected', () => {
        incoming.next('{"type":"buzzer_connected","username":"quiz_buzzer_01"}');
        incoming.next('{"type":"buzzer_connected","username":"quiz_buzzer_02"}');
        const before = service.connectedBuzzers();

        incoming.next('{"type":"game_state_sync","connected_buzzers":["quiz_buzzer_01","quiz_buzzer_02"]}');

        expect(service.connectedBuzzers()).toBe(before);
    });
    it('should replace the connected buzzers when a game_state_sync lists the same ones in another order', () => {
        incoming.next('{"type":"buzzer_connected","username":"quiz_buzzer_01"}');
        incoming.next('{"type":"buzzer_connected","username":"quiz_buzzer_02"}');

        incoming.next('{"type":"game_state_sync","connected_buzzers":["quiz_buzzer_02","quiz_buzzer_01"]}');

        expect(service.connectedBuzzers()).toEqual(['quiz_buzzer_02', 'quiz_buzzer_01']);
    });
    it('should leave the game state as it is when a game_state_sync carries no game field', () => {
        service.transitionTo('lobby');
        const before = service.state();

        incoming.next('{"type":"game_state_sync","connected_buzzers":["quiz_buzzer_01"]}');

        expect(service.state()).toBe(before);
        expect(service.state().phase).toBe('lobby');
    });
    it('should not notify anyone when the connected buzzers do not change', () => {
        incoming.next('{"type":"buzzer_connected","username":"quiz_buzzer_01"}');
        const before = service.connectedBuzzers();

        incoming.next('{"type":"buzzer_connected","username":"quiz_buzzer_01"}');
        incoming.next('{"type":"buzzer_disconnected","username":"quiz_buzzer_02"}');

        expect(service.connectedBuzzers()).toBe(before);
    });
    it.each([
        '{"type":"buzzer_connected"}',
        '{"type":"buzzer_connected","username":42}',
        '{"type":"buzzer_connected","username":null}',
    ])('should not list a buzzer on %s', (data) => {
        incoming.next(data);

        expect(service.connectedBuzzers()).toEqual([]);
    });
    it('should restore the game state from a full game_state_sync', () => {
        incoming.next(fullSyncJson());

        expect(service.state()).toMatchObject({
            gameId: 'game-1',
            status: 'OPEN',
            questionIndex: 2,
            quizId: 'quiz-1',
            participants: [{ order: 1, name: 'Alice', cumulative_score: 30 }],
        });
    });
    it('should replace the game state and the connected buzzers together on a full game_state_sync', () => {
        incoming.next('{"type":"buzzer_connected","username":"quiz_buzzer_09"}');

        incoming.next(fullSyncJson({ connected_buzzers: ['quiz_buzzer_02', 'quiz_buzzer_01'] }));

        expect(service.state().gameId).toBe('game-1');
        expect(service.connectedBuzzers()).toEqual(['quiz_buzzer_02', 'quiz_buzzer_01']);
    });
    it.each(['game_id', 'status', 'question_index', 'quiz_id', 'participants', 'connected_buzzers'])(
        'should reject the whole full game_state_sync when %s is missing',
        (field) => {
            incoming.next('{"type":"buzzer_connected","username":"quiz_buzzer_09"}');
            const stateBefore = service.state();
            const buzzersBefore = service.connectedBuzzers();

            expect(() => incoming.next(fullSyncJson({ [field]: undefined }))).not.toThrow();

            expect(service.state()).toBe(stateBefore);
            expect(service.connectedBuzzers()).toBe(buzzersBefore);
        },
    );
    it.each<[string, unknown]>([
        ['game_id', 42],
        ['game_id', null],
        ['status', 'RUNNING'],
        ['status', 'open'],
        ['status', 3],
        ['question_index', '2'],
        ['question_index', null],
        ['quiz_id', 7],
        ['participants', 'Alice'],
        ['participants', { order: 1, name: 'Alice', cumulative_score: 30 }],
        ['participants', [null]],
        ['participants', [{ order: '1', name: 'Alice', cumulative_score: 30 }]],
        ['participants', [{ order: 1, name: 7, cumulative_score: 30 }]],
        ['participants', [{ order: 1, name: 'Alice', cumulative_score: '30' }]],
        ['participants', [{ order: 1, name: 'Alice' }]],
        ['participants', [{ order: 1, name: 'Alice', cumulative_score: 30 }, { order: 2 }]],
        ['started_at', 1700000000],
        ['started_at', null],
        ['time_limit', '30'],
        ['time_limit', null],
        ['connected_buzzers', [{ username: 'quiz_buzzer_01' }]],
        ['connected_buzzers', null],
    ])(
        'should reject the whole full game_state_sync when %s is %j',
        (field, value) => {
            incoming.next('{"type":"buzzer_connected","username":"quiz_buzzer_09"}');
            const stateBefore = service.state();
            const buzzersBefore = service.connectedBuzzers();

            expect(() => incoming.next(fullSyncJson({ [field]: value }))).not.toThrow();

            expect(service.state()).toBe(stateBefore);
            expect(service.connectedBuzzers()).toBe(buzzersBefore);
        },
    );
    it('should have no game and no timer before any game_state_sync', () => {
        expect(service.state()).toEqual({
            phase: 'setup',
            gameId: null,
            status: null,
            questionIndex: null,
            quizId: null,
            participants: [],
            startedAt: null,
            timeLimit: null,
        });
    });
    it('should take the start time and the time limit of a full game_state_sync that carries them', () => {
        incoming.next(fullSyncJson({ status: 'QUESTION_OPEN', started_at: '2026-11-23T10:00:00.000Z', time_limit: 30 }));

        expect(service.state().startedAt).toBe('2026-11-23T10:00:00.000Z');
        expect(service.state().timeLimit).toBe(30);
    });
    it('should reset the start time and the time limit when a full game_state_sync does not carry them', () => {
        incoming.next(fullSyncJson({ status: 'QUESTION_OPEN', started_at: '2026-11-23T10:00:00.000Z', time_limit: 30 }));

        incoming.next(fullSyncJson({ status: 'QUESTION_CLOSED' }));

        expect(service.state().startedAt).toBeNull();
        expect(service.state().timeLimit).toBeNull();
    });
    it('should replace the previous game state in full on a full game_state_sync', () => {
        incoming.next(fullSyncJson());

        incoming.next(
            fullSyncJson({
                game_id: 'game-2',
                status: 'QUESTION_TITLE',
                question_index: 0,
                quiz_id: 'quiz-2',
                participants: [],
            }),
        );

        expect(service.state()).toMatchObject({
            gameId: 'game-2',
            status: 'QUESTION_TITLE',
            questionIndex: 0,
            quizId: 'quiz-2',
            participants: [],
        });
    });
    it.each(['PENDING', 'OPEN', 'QUESTION_TITLE', 'QUESTION_OPEN', 'QUESTION_BUZZED', 'QUESTION_CLOSED', 'COMPLETED', 'IN_ERROR'])(
        'should accept the status %s in a full game_state_sync',
        (status) => {
            incoming.next(fullSyncJson({ status }));

            expect(service.state().status).toBe(status);
        },
    );
    it.each<[string, unknown]>([
        ['question_index', 2],
        ['quiz_id', 'quiz-1'],
        ['participants', [{ order: 1, name: 'Alice', cumulative_score: 30 }]],
        ['started_at', '2026-11-23T10:00:00.000Z'],
        ['time_limit', 30],
    ])(
        'should reject the whole game_state_sync that carries %s without game_id nor status, even with valid connected buzzers',
        (field, value) => {
            incoming.next('{"type":"buzzer_connected","username":"quiz_buzzer_09"}');
            const stateBefore = service.state();
            const buzzersBefore = service.connectedBuzzers();

            expect(() =>
                incoming.next(
                    JSON.stringify({ type: 'game_state_sync', [field]: value, connected_buzzers: ['quiz_buzzer_01'] }),
                ),
            ).not.toThrow();

            expect(service.state()).toBe(stateBefore);
            expect(service.connectedBuzzers()).toBe(buzzersBefore);
        },
    );
    it('should keep listening after rejecting a full game_state_sync', () => {
        incoming.next(fullSyncJson({ status: 'RUNNING' }));
        incoming.next(fullSyncJson({ game_id: 'game-2', connected_buzzers: ['quiz_buzzer_02'] }));

        expect(service.state().gameId).toBe('game-2');
        expect(service.connectedBuzzers()).toEqual(['quiz_buzzer_02']);
    });
    it('should keep the phase when a full game_state_sync restores the game', () => {
        service.transitionTo('lobby');

        incoming.next(fullSyncJson({ status: 'QUESTION_OPEN' }));

        expect(service.state().phase).toBe('lobby');
    });
    it('should keep the restored game when the phase changes', () => {
        incoming.next(fullSyncJson());

        service.transitionTo('playing');

        expect(service.state()).toMatchObject({ phase: 'playing', gameId: 'game-1', status: 'OPEN' });
    });
    it.each([
        ['game_id', 'game-1'],
        ['status', 'OPEN'],
    ])(
        'should reject the whole game_state_sync that carries %s without the other of game_id and status, even with valid connected buzzers',
        (field, value) => {
            incoming.next('{"type":"buzzer_connected","username":"quiz_buzzer_09"}');
            const stateBefore = service.state();
            const buzzersBefore = service.connectedBuzzers();

            incoming.next(
                JSON.stringify({ type: 'game_state_sync', [field]: value, connected_buzzers: ['quiz_buzzer_01'] }),
            );

            expect(service.state()).toBe(stateBefore);
            expect(service.connectedBuzzers()).toBe(buzzersBefore);
        },
    );
    it('should not know the connected buzzers before any game_state_sync', () => {
        expect(service.buzzersKnown()).toBe(false);
    });
    it('should know the connected buzzers once a partial game_state_sync carries them', () => {
        incoming.next('{"type":"game_state_sync","connected_buzzers":["quiz_buzzer_01"]}');

        expect(service.buzzersKnown()).toBe(true);
    });
    it('should know the connected buzzers when a game_state_sync lists none', () => {
        incoming.next('{"type":"game_state_sync","connected_buzzers":[]}');

        expect(service.buzzersKnown()).toBe(true);
    });
    it('should know the connected buzzers once a full game_state_sync carries them', () => {
        incoming.next(fullSyncJson());

        expect(service.buzzersKnown()).toBe(true);
    });
    it('should not know the connected buzzers when a game_state_sync does not carry them', () => {
        incoming.next('{"type":"game_state_sync"}');
        incoming.next(JSON.stringify({ type: 'game_state_sync', question_index: 1 }));

        expect(service.buzzersKnown()).toBe(false);
    });
    it.each([
        '{"type":"game_state_sync","connected_buzzers":[{"username":"quiz_buzzer_09"}]}',
        '{"type":"game_state_sync","connected_buzzers":null}',
        '{"type":"game_state_sync","game_id":"game-1","connected_buzzers":["quiz_buzzer_01"]}',
        JSON.stringify(fullSync({ status: 'UNKNOWN' })),
        JSON.stringify(fullSync({ connected_buzzers: [{ username: 'quiz_buzzer_01' }] })),
    ])('should not know the connected buzzers when the game_state_sync is rejected: %s', (data) => {
        incoming.next(data);

        expect(service.buzzersKnown()).toBe(false);
    });
    it('should not know the connected buzzers when a buzzer connects or disconnects alone', () => {
        incoming.next('{"type":"buzzer_connected","username":"quiz_buzzer_01"}');
        incoming.next('{"type":"buzzer_disconnected","username":"quiz_buzzer_01"}');

        expect(service.buzzersKnown()).toBe(false);
    });
    it('should keep knowing the connected buzzers after a rejected game_state_sync and after the last buzzer leaves', () => {
        incoming.next('{"type":"game_state_sync","connected_buzzers":["quiz_buzzer_01"]}');

        incoming.next('{"type":"game_state_sync","connected_buzzers":[{"username":"quiz_buzzer_01"}]}');
        incoming.next(JSON.stringify(fullSync({ status: 'UNKNOWN' })));
        incoming.next('{"type":"buzzer_disconnected","username":"quiz_buzzer_01"}');
        incoming.next('{"type":"game_state_sync"}');

        expect(service.buzzersKnown()).toBe(true);
    });
    it('should expose no status before any game is known', () => {
        expect(service.status()).toBeNull();
    });
    it('should expose the status carried by the game_state_sync', () => {
        incoming.next(fullSyncJson({ status: 'QUESTION_OPEN' }));

        expect(service.status()).toBe('QUESTION_OPEN');
    });
    it.each([
        ['OPEN', true],
        ['QUESTION_TITLE', true],
        ['QUESTION_OPEN', true],
        ['QUESTION_BUZZED', true],
        ['QUESTION_CLOSED', true],
        ['PENDING', false],
        ['COMPLETED', false],
        ['IN_ERROR', false],
    ])('should tell whether a game with the status %s is active: %s', (status, expected) => {
        incoming.next(fullSyncJson({ status }));

        expect(service.isActive()).toBe(expected);
    });
    it('should not be active before any game is known', () => {
        expect(service.isActive()).toBe(false);
    });
    it.each([
        ['PENDING', true],
        ['OPEN', true],
        ['QUESTION_TITLE', true],
        ['QUESTION_OPEN', true],
        ['QUESTION_BUZZED', true],
        ['QUESTION_CLOSED', true],
        ['COMPLETED', false],
        ['IN_ERROR', false],
    ])('should tell whether a game with the status %s is being piloted: %s', (status, expected) => {
        incoming.next(fullSyncJson({ status }));

        expect(service.isPiloting()).toBe(expected);
    });
    it('should not be piloting before any game is known', () => {
        expect(service.isPiloting()).toBe(false);
    });
});
