import { signal } from '@angular/core';
import { SocketLike, WebSocketService } from './websocket.service';

class FakeSocket implements SocketLike {
    constructor(public readonly url: string) { }

    onmessage: ((event: MessageEvent) => void) | null = null;
    onclose: ((event: CloseEvent) => void) | null = null;

    public sentMessage: string | undefined;

    send(data: string): void {
        this.sentMessage = data;
    }

    simulateMessage(data: string): void {
        if (this.onmessage !== null) {
            this.onmessage(new MessageEvent('message', { data }));
        }
    }

    simulateClose(): void {
        if (this.onclose !== null) {
            this.onclose(new CloseEvent('close'));
        }
    }
}

describe("WebSocket service", () => {
    let callCount: number;
    let capturedSocket: FakeSocket | undefined;
    let service: WebSocketService;
    beforeEach(() => {
        callCount = 0;
        const ctor = class extends FakeSocket {
            constructor(url: string) {
                super(url);
                capturedSocket = this;
                callCount++;
            }
        };
        const fakeTokenProvider = { token: signal('fake-jwt') }
        service = new WebSocketService(ctor, 'ws://test/ws', fakeTokenProvider);
    });
    it("should setup the url", () => {
        service.connect();
        expect(capturedSocket!.url).toBe('ws://test/ws');
    });
    it("should send auth as type", () => {
        service.connect();
        expect(JSON.parse(capturedSocket!.sentMessage!).type).toBe("auth");
    });
    it("should send the token", () => {
        service.connect();
        expect(JSON.parse(capturedSocket!.sentMessage!).token).toBe('fake-jwt');
    });
    it("should emit incoming messages", () => {
        service.connect();
        let received: string | undefined;
        service.messages$.subscribe((m) => received = m);

        capturedSocket!.simulateMessage('{"type":"auth_success"}');

        expect(received).toBe('{"type":"auth_success"}');
    });
    it("should not reconnect before a delay elapses", () => {
        vi.useFakeTimers();

        service.connect();
        capturedSocket!.simulateClose();

        // assertion 1 : rien ne s'est encore reconnecté
        expect(callCount).toBe(1);

        vi.advanceTimersByTime(1000);

        // assertion 2 : maintenant, oui
        expect(callCount).toBe(2);

        vi.useRealTimers();
    });
    it("should reconnect after exponential delay", () => {
        vi.useFakeTimers();
        
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

        vi.useRealTimers();
    });
});