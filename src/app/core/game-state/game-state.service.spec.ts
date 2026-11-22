import { Subject } from 'rxjs';
import { GameStateService } from './game-state.service'
import { OutboundMessage } from '../websocket/websocket.service';

describe('GameStateService', () => {
    let service: GameStateService;
    let incoming: Subject<string>;
    let hub: { messages$: Subject<string>; send: ReturnType<typeof vi.fn<(message: OutboundMessage) => void>> };

    beforeEach(() => {
        incoming = new Subject<string>();
        hub = { messages$: incoming, send: vi.fn<(message: OutboundMessage) => void>() };
        service = new GameStateService(hub);
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
        '{"type":"game_state_sync","connected_buzzers":["quiz_buzzer_09"]}',
        '{"type":"buzzer_buzzed","username":"quiz_buzzer_01"}',
        'not json',
    ])('should not change the connected buzzers on %s', (data) => {
        incoming.next('{"type":"buzzer_connected","username":"quiz_buzzer_01"}');

        incoming.next(data);

        expect(service.connectedBuzzers()).toEqual(['quiz_buzzer_01']);
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
});
