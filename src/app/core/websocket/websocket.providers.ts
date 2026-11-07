import { InjectionToken } from '@angular/core';
import { WebSocketCtor } from './websocket.service';

export const WEB_SOCKET_CONSTRUCTOR = new InjectionToken<WebSocketCtor>('WEB_SOCKET_CONSTRUCTOR', {
  providedIn: 'root',
  factory: () => WebSocket,
});
