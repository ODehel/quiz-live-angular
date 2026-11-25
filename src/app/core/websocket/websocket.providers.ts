import { InjectionToken } from '@angular/core';
import { WebSocketCtor } from './websocket.service';

export const WEB_SOCKET_CONSTRUCTOR = new InjectionToken<WebSocketCtor>('WEB_SOCKET_CONSTRUCTOR', {
  providedIn: 'root',
  factory: () => WebSocket,
});

/** Adresse du serveur telle qu'affichée (`hôte:port` de `wsUrl`, ou sa valeur brute) : fournie par `app.config.ts`. */
export const SERVER_ADDRESS = new InjectionToken<string>('SERVER_ADDRESS');
