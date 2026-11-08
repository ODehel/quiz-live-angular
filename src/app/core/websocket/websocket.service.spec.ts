import { SocketLike, WebSocketService } from './websocket.service';

class FakeSocket implements SocketLike {
    constructor(public readonly url: string) { }

    onopen: (() => void) | null = null;
    onmessage: ((event: MessageEvent) => void) | null = null;
    onclose: ((event: CloseEvent) => void) | null = null;

    public sentMessage: string | undefined;
    public closeCalls = 0;

    send(data: string): void {
        this.sentMessage = data;
    }

    close(code: number = 1000): void {
        this.closeCalls++;
        this.simulateClose(code);
    }

    simulateOpen(): void {
        if (this.onopen !== null) {
            this.onopen();
        }
    }

    simulateMessage(data: string): void {
        if (this.onmessage !== null) {
            this.onmessage(new MessageEvent('message', { data }));
        }
    }

    simulateClose(code: number = 1000): void {
        if (this.onclose !== null) {
            this.onclose(new CloseEvent('close', { code }));
        }
    }
}

describe("WebSocket service", () => {
    let callCount: number;
    let capturedSocket: FakeSocket | undefined;
    let service: WebSocketService;
    let fakeTokenProvider: {
        getToken: ReturnType<typeof vi.fn<() => string | null>>;
        refresh: ReturnType<typeof vi.fn<() => Promise<void>>>;
    };
    let fakeErrorNavigator: { goToError: ReturnType<typeof vi.fn<() => void>> };
    beforeEach(() => {
        callCount = 0;
        const register = (socket: FakeSocket): void => { capturedSocket = socket; };
        const ctor = class extends FakeSocket {
            constructor(url: string) {
                super(url);
                register(this);
                callCount++;
            }
        };
        fakeTokenProvider = {
            getToken: vi.fn<() => string | null>(() => 'fake-jwt'),
            refresh: vi.fn<() => Promise<void>>(() => Promise.resolve())
        };
        fakeErrorNavigator = { goToError: vi.fn<() => void>() };
        service = new WebSocketService(ctor, 'ws://test/ws', fakeTokenProvider, fakeErrorNavigator);
    });
    it("should setup the url", () => {
        service.connect();
        expect(capturedSocket!.url).toBe('ws://test/ws');
    });
    it("should not send anything before the socket is open", () => {
        service.connect();
        expect(capturedSocket!.sentMessage).toBeUndefined();
    });
    it("should send auth as type", () => {
        service.connect();
        capturedSocket!.simulateOpen();
        expect(JSON.parse(capturedSocket!.sentMessage!).type).toBe("auth");
    });
    it("should send the token", () => {
        service.connect();
        capturedSocket!.simulateOpen();
        expect(JSON.parse(capturedSocket!.sentMessage!).token).toBe('fake-jwt');
    });
    it("should read the token when the socket opens, not when it is created", () => {
        service.connect();
        fakeTokenProvider.getToken.mockReturnValue('late-jwt');

        capturedSocket!.simulateOpen();

        expect(JSON.parse(capturedSocket!.sentMessage!).token).toBe('late-jwt');
    });
    it("should emit incoming messages", () => {
        service.connect();
        let received: string | undefined;
        service.messages$.subscribe((m) => received = m);

        capturedSocket!.simulateMessage('{"type":"auth_success"}');

        expect(received).toBe('{"type":"auth_success"}');
    });
    it("should still emit a message that is not JSON", () => {
        service.connect();
        let received: string | undefined;
        service.messages$.subscribe((m) => received = m);

        expect(() => capturedSocket!.simulateMessage('not json')).not.toThrow();

        expect(received).toBe('not json');
    });
    it("should refresh the token when the hub announces its expiry", () => {
        service.connect();

        capturedSocket!.simulateMessage('{"type":"token_expiring_soon"}');

        expect(fakeTokenProvider.refresh).toHaveBeenCalledTimes(1);
    });
    it("should stay silent when the token refresh fails after the expiry announcement", async () => {
        // Fonction nue, pas un spy : vi.fn() attache un gestionnaire aux promesses qu'il retourne
        // et masquerait un rejet non capturé.
        let refreshCalls = 0;
        Object.assign(fakeTokenProvider, {
            refresh: () => {
                refreshCalls++;
                return Promise.reject(new Error('network down'));
            }
        });
        service.connect();

        capturedSocket!.simulateMessage('{"type":"token_expiring_soon"}');
        await new Promise<void>((resolve) => setTimeout(resolve, 0));

        expect(refreshCalls).toBe(1);
    });
    it("should send the refreshed token to the hub on the open connection", async () => {
        service.connect();
        capturedSocket!.simulateOpen();
        fakeTokenProvider.refresh.mockImplementation(async () => {
            fakeTokenProvider.getToken.mockReturnValue('new-jwt');
        });

        capturedSocket!.simulateMessage('{"type":"token_expiring_soon"}');
        await new Promise<void>((resolve) => setTimeout(resolve, 0));

        expect(JSON.parse(capturedSocket!.sentMessage!)).toEqual({ type: 'auth_refresh', token: 'new-jwt' });
    });
    it("should not send a token to the hub when the refresh fails", async () => {
        service.connect();
        capturedSocket!.simulateOpen();
        fakeTokenProvider.refresh.mockImplementation(() => Promise.reject(new Error('network down')));

        capturedSocket!.simulateMessage('{"type":"token_expiring_soon"}');
        await new Promise<void>((resolve) => setTimeout(resolve, 0));

        expect(JSON.parse(capturedSocket!.sentMessage!).type).toBe('auth');
    });
    describe("under simulated time", () => {
        beforeEach(() => vi.useFakeTimers());
        afterEach(() => vi.useRealTimers());
        it("should not reconnect before a delay elapses", () => {
            service.connect();
            capturedSocket!.simulateClose();

            // assertion 1 : rien ne s'est encore reconnecté
            expect(callCount).toBe(1);

            vi.advanceTimersByTime(1000);

            // assertion 2 : maintenant, oui
            expect(callCount).toBe(2);
        });
        it("should reconnect after exponential delay", () => {
            service.connect();
            capturedSocket!.simulateClose();

            expect(callCount).toBe(1);

            vi.advanceTimersByTime(1000);
            expect(callCount).toBe(2);

            capturedSocket!.simulateClose();
            vi.advanceTimersByTime(1000);
            expect(callCount).toBe(2);

            vi.advanceTimersByTime(1000);
            expect(callCount).toBe(3);
        });
        it("should cap the reconnection delay at 30 seconds", () => {
            service.connect();

            // Monte attempt de 0 à 5 : encaisse 5 fermetures, chaque délai écoulé.
            for (let i = 0; i < 5; i++) {
                capturedSocket!.simulateClose();
                vi.advanceTimersByTime(Math.pow(2, i) * 1000);   // 1000, 2000, 4000, 8000, 16000
            }
            expect(callCount).toBe(6);          // 1 connexion initiale + 5 reconnexions

            // 6e fermeture (attempt = 5) : exponentiel pur armerait 32000, le contrat plafonne à 30000.
            capturedSocket!.simulateClose();

            vi.advanceTimersByTime(29999);
            expect(callCount).toBe(6);          // borne basse : rien avant 30000 (tue tout plafond < 30000)

            vi.advanceTimersByTime(1);          // total 30000
            expect(callCount).toBe(7);          // ← MORD : plafonné reconnecte, 32000 dormirait encore
        });
        it("should restart the reconnection delay at 1 second once the hub accepts the session", () => {
            service.connect();

            // Deux coupures sans aboutir : attempt monte à 2 (délais 1 s puis 2 s).
            capturedSocket!.simulateClose();
            vi.advanceTimersByTime(1000);
            capturedSocket!.simulateClose();
            vi.advanceTimersByTime(2000);
            expect(callCount).toBe(3);

            // Le hub accepte la session : la série d'échecs est terminée.
            capturedSocket!.simulateMessage('{"type":"auth_success"}');

            // Nouvelle coupure : sans remise à zéro, le délai serait 4 s.
            capturedSocket!.simulateClose();
            vi.advanceTimersByTime(1000);

            expect(callCount).toBe(4);
        });
        it("should keep the reconnection delay growing when the hub sends any other message", () => {
            service.connect();

            capturedSocket!.simulateClose();
            vi.advanceTimersByTime(1000);
            capturedSocket!.simulateClose();
            vi.advanceTimersByTime(2000);
            expect(callCount).toBe(3);

            capturedSocket!.simulateMessage('{"type":"game_state_sync"}');

            capturedSocket!.simulateClose();
            vi.advanceTimersByTime(1000);
            expect(callCount).toBe(3);          // le délai reste 4 s

            vi.advanceTimersByTime(3000);
            expect(callCount).toBe(4);
        });
        it("should keep the reconnection delay growing when the hub sends a message that is not JSON", () => {
            service.connect();

            capturedSocket!.simulateClose();
            vi.advanceTimersByTime(1000);
            capturedSocket!.simulateClose();
            vi.advanceTimersByTime(2000);
            expect(callCount).toBe(3);

            capturedSocket!.simulateMessage('not json');

            capturedSocket!.simulateClose();
            vi.advanceTimersByTime(1000);

            expect(callCount).toBe(3);
        });
        it("should send the current token on reconnection", () => {
            service.connect();
            fakeTokenProvider.getToken.mockReturnValue('refreshed-jwt');

            capturedSocket!.simulateClose();
            vi.advanceTimersByTime(1000);
            capturedSocket!.simulateOpen();

            expect(JSON.parse(capturedSocket!.sentMessage!).token).toBe('refreshed-jwt');
        });
        it("should refresh the token when the server closes with 4002", () => {
            service.connect();
            capturedSocket!.simulateClose(4002);

            expect(fakeTokenProvider.refresh).toHaveBeenCalled();
        });
        it("should not reconnect until the token refresh has completed after a 4002 close", async () => {
            service.connect();

            // Promesse CONTRÔLÉE : refresh reste en vol jusqu'à ce que le test la résolve.
            let resolveRefresh!: () => void;
            fakeTokenProvider.refresh = vi.fn(() =>
                new Promise<void>((resolve) => {
                    resolveRefresh = () => {
                        fakeTokenProvider.getToken.mockReturnValue('refreshed-jwt');
                        resolve();
                    };
                })
            );

            capturedSocket!.simulateClose(4002);

            // Instantané 1 : refresh EN VOL. On avance le temps.
            // Prod correcte (await) : onclose bloqué → aucun setTimeout armé → pas de reconnexion.
            // Prod fautive (sans await) : setTimeout déjà armé → reconnecte → callCount passe à 2.
            await vi.advanceTimersByTimeAsync(1000);
            expect(callCount).toBe(1);   // ← MORD : sans await, ce serait 2

            // Instantané 2 : le refresh aboutit. Le token devient frais, le setTimeout s'arme.
            resolveRefresh();
            await vi.advanceTimersByTimeAsync(1000);

            expect(callCount).toBe(2);
            capturedSocket!.simulateOpen();
            expect(JSON.parse(capturedSocket!.sentMessage!).token).toBe('refreshed-jwt');
        });
        it("should keep reconnecting when the token refresh fails after a 4002 close", async () => {
            fakeTokenProvider.refresh.mockRejectedValue(new Error('network down'));
            service.connect();

            capturedSocket!.simulateClose(4002);
            await vi.advanceTimersByTimeAsync(1000);

            expect(callCount).toBe(2);
        });
        it("should refresh the token once and reconnect once when the hub announces the expiry then closes with 4002", async () => {
            service.connect();

            capturedSocket!.simulateMessage('{"type":"token_expired"}');
            capturedSocket!.simulateClose(4002);
            await vi.advanceTimersByTimeAsync(1000);

            expect(fakeTokenProvider.refresh).toHaveBeenCalledTimes(1);
            expect(callCount).toBe(2);
        });
        it("should retry the token refresh after 5 seconds when it fails after the expiry announcement", async () => {
            fakeTokenProvider.refresh.mockRejectedValue(new Error('network down'));
            service.connect();

            capturedSocket!.simulateMessage('{"type":"token_expiring_soon"}');
            await vi.advanceTimersByTimeAsync(4999);
            expect(fakeTokenProvider.refresh).toHaveBeenCalledTimes(1);

            await vi.advanceTimersByTimeAsync(1);
            expect(fakeTokenProvider.refresh).toHaveBeenCalledTimes(2);
        });
        it("should send the refreshed token to the hub when a retry of the token refresh succeeds", async () => {
            fakeTokenProvider.refresh
                .mockRejectedValueOnce(new Error('network down'))
                .mockImplementationOnce(async () => { fakeTokenProvider.getToken.mockReturnValue('retried-jwt'); });
            service.connect();
            capturedSocket!.simulateOpen();

            capturedSocket!.simulateMessage('{"type":"token_expiring_soon"}');
            await vi.advanceTimersByTimeAsync(5000);

            expect(JSON.parse(capturedSocket!.sentMessage!)).toEqual({ type: 'auth_refresh', token: 'retried-jwt' });
        });
        it("should give up the token refresh after three failed attempts", async () => {
            fakeTokenProvider.refresh.mockRejectedValue(new Error('network down'));
            service.connect();

            capturedSocket!.simulateMessage('{"type":"token_expiring_soon"}');
            await vi.advanceTimersByTimeAsync(60000);

            expect(fakeTokenProvider.refresh).toHaveBeenCalledTimes(3);
        });
        it("should close the connection and reconnect once the token refresh has failed three times", async () => {
            fakeTokenProvider.refresh.mockRejectedValue(new Error('network down'));
            service.connect();
            const firstSocket = capturedSocket!;

            firstSocket.simulateMessage('{"type":"token_expiring_soon"}');
            await vi.advanceTimersByTimeAsync(9999);
            expect(firstSocket.closeCalls).toBe(0);

            await vi.advanceTimersByTimeAsync(1);
            expect(firstSocket.closeCalls).toBe(1);
            expect(callCount).toBe(1);

            await vi.advanceTimersByTimeAsync(1000);
            expect(callCount).toBe(2);
        });
        it("should stop retrying the token refresh once the connection has closed", async () => {
            fakeTokenProvider.refresh.mockRejectedValue(new Error('network down'));
            service.connect();

            capturedSocket!.simulateMessage('{"type":"token_expiring_soon"}');
            await vi.advanceTimersByTimeAsync(1000);
            capturedSocket!.simulateClose(1006);
            await vi.advanceTimersByTimeAsync(60000);

            expect(fakeTokenProvider.refresh).toHaveBeenCalledTimes(1);
        });
        it("should not send the refreshed token when the connection closed while the refresh was running", async () => {
            let resolveRefresh!: () => void;
            fakeTokenProvider.refresh.mockImplementation(() => new Promise<void>((resolve) => { resolveRefresh = resolve; }));
            service.connect();
            const firstSocket = capturedSocket!;
            firstSocket.simulateOpen();

            firstSocket.simulateMessage('{"type":"token_expiring_soon"}');
            firstSocket.simulateClose(1006);
            resolveRefresh();
            await vi.advanceTimersByTimeAsync(0);

            expect(JSON.parse(firstSocket.sentMessage!).type).toBe('auth');
        });
        it("should not close a connection that has already closed when the last refresh attempt fails", async () => {
            let rejectRefresh!: (reason: Error) => void;
            fakeTokenProvider.refresh
                .mockRejectedValueOnce(new Error('network down'))
                .mockRejectedValueOnce(new Error('network down'))
                .mockImplementationOnce(() => new Promise<void>((_, reject) => { rejectRefresh = reject; }));
            service.connect();
            const firstSocket = capturedSocket!;

            firstSocket.simulateMessage('{"type":"token_expiring_soon"}');
            await vi.advanceTimersByTimeAsync(10000);
            firstSocket.simulateClose(1006);
            rejectRefresh(new Error('network down'));
            await vi.advanceTimersByTimeAsync(0);

            expect(firstSocket.closeCalls).toBe(0);
        });
        it("should navigate to the error page without reconnecting when the server closes with 4004", () => {
            service.connect();
            capturedSocket!.simulateClose(4004);

            vi.advanceTimersByTime(30000);

            expect(callCount).toBe(1);
            expect(fakeErrorNavigator.goToError).toHaveBeenCalled();
        });
    });
});