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
});
