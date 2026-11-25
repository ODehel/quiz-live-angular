import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { WebSocketService } from '../websocket/websocket.service';
import { SERVER_ADDRESS } from '../websocket/websocket.providers';

type ConnectionState = 'connected' | 'reconnecting' | 'disconnected';

const LABELS: Record<ConnectionState, string> = {
    connected: 'Connecté',
    reconnecting: 'Reconnexion…',
    disconnected: 'Déconnecté'
};

@Component({
    selector: 'app-top-bar',
    templateUrl: './top-bar.html',
    styleUrl: './top-bar.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopBar {
    private readonly webSocket = inject(WebSocketService);
    protected readonly address = inject(SERVER_ADDRESS);
    // Trois états, pas de quatrième : rouge = cause permanente, vert = authentifié, orange = tout le reste.
    protected readonly state = computed<ConnectionState>(() => {
        if (this.webSocket.isDisconnected()) {
            return 'disconnected';
        }
        return this.webSocket.isConnected() ? 'connected' : 'reconnecting';
    });
    protected readonly label = computed(() => LABELS[this.state()]);
}
