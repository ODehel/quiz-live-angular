import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, isActive } from '@angular/router';
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
    private readonly router = inject(Router);
    protected readonly lockedTooltip = 'Indisponible pendant une partie';
    // Liens du groupe Contenu : coupés pendant une partie, sauf en état « Déconnecté » (aucune partie connue).
    protected readonly contentLocked = computed(() => this.gameState.isPiloting() && !this.webSocket.isDisconnected());
    // Le lien « Thèmes » désactivé n'a plus de routerLink (pas d'href, inactivable au clavier) : routerLinkActive ne le marque plus.
    // La mise en évidence se dérive donc de l'URL courante, verrouillé ou non (mêmes options de correspondance que routerLinkActive).
    protected readonly themesActive = isActive('/content/themes', this.router);
}
