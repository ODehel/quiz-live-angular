import { WebSocketService } from './websocket.service';

class FakeSocket {
    constructor(public readonly url: string) { }

    public readyState = 0;

    public onopen: ((evt: Event) => void) | null = null;
    public onclose: ((evt: CloseEvent) => void) | null = null;
    public onerror: ((evt: Event) => void) | null = null;
    public onmessage: ((evt: MessageEvent) => void) | null = null;

    // 4. send(data) : capturer l'argument reçu.
    //    → une méthode + un endroit où stocker ce qui a été envoyé.
    //      (un seul message ? plusieurs ? le CA parle du "premier"...)

    // 5. close() : rxjs l'appelle au teardown.
    //    → une méthode. Doit-elle faire quelque chose pour notre test ?
}

describe("WebSocket service", () => {
    it("should setup the url", () => {
        let capturedSocket: FakeSocket | undefined;

        const ctor = class {
            constructor(url: string) {
                capturedSocket = new FakeSocket(url);
                return capturedSocket;
            }
        };
        const service = new WebSocketService(ctor, 'ws://test/ws');
        service.connect();
        expect(capturedSocket!.url).toBe('ws://test/ws');
    });
});