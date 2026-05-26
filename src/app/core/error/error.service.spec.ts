import { ErrorContext, ErrorService } from './error.service';

describe("ErrorService", () => {
    it("starts with no error", () => {
        const service = new ErrorService();
        expect(service.currentError()).toBeNull();
    });

    it.each<{ variant: ErrorContext['variant'], call: (s: ErrorService) => void }>([
        { variant: 'not-found', call: s => s.notFound() },
        { variant: 'connection-lost', call: s => s.connectionLost() },
        { variant: 'server-error', call: s => s.serverError() },
        { variant: 'game-corrupted', call: s => s.gameCorrupted() }
    ])("stores a '$variant' error", ({ variant, call }) => {
        const service = new ErrorService();
        call(service);
        expect(service.currentError()?.variant).toBe(variant);
    });

    it("clears the current error", () => {
        const service = new ErrorService();
        service.notFound();
        service.clearError();
        expect(service.currentError()).toBeNull();
    });
});