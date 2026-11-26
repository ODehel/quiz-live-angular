import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { GameStateService } from '../game-state/game-state.service';
import { WebSocketService } from '../websocket/websocket.service';

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.html',
    styleUrl: './sidebar.scss',
    imports: [RouterLink, RouterLinkActive],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Sidebar {
    private readonly gameState = inject(GameStateService);
    private readonly webSocket = inject(WebSocketService);
    protected readonly lockedTooltip = 'Indisponible pendant une partie';
    // Liens du groupe Contenu : coupés pendant une partie, sauf en état « Déconnecté » (aucune partie connue).
    protected readonly contentLocked = computed(() => this.gameState.isPiloting() && !this.webSocket.isDisconnected());
}
