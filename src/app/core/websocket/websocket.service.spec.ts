import { signal } from '@angular/core';
import { SocketLike, WebSocketService } from './websocket.service';

class FakeSocket implements SocketLike {
    constructor(public readonly url: string) { }

    public sentMessage: string | undefined;

    send(data: string): void {
        this.sentMessage = data;
    }
}

describe("WebSocket service", () => {
    let capturedSocket: FakeSocket | undefined;
    let service: WebSocketService;
    beforeEach(() => {
        const ctor = class extends FakeSocket {
            constructor(url: string) {
                super(url);
                capturedSocket = this;
            }
        };
        const fakeTokenProvider  = { token: signal('fake-jwt') }
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
});