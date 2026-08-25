type WebSocketCtor = new (url: string) => object;

export class WebSocketService {
  constructor(
    private readonly webSocketConstructor: WebSocketCtor,
    private readonly wsUrl: string
  ) {}

  connect(): void {
    new this.webSocketConstructor(this.wsUrl);
  }
}