import { GameStateService } from './game-state.service'

describe('GameStateService', () => {
    let service: GameStateService;

    beforeEach(() => {
        service = new GameStateService();
    });
    it('should have setup as initial phase', () => {
        expect(service.state().phase).toBe('setup');
    });
    it('should change of state', () => {
        service.transitionTo('lobby');

        expect(service.state().phase).toBe('lobby');
    });
});