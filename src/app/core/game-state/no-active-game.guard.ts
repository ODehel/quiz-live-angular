import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { WebSocketService } from '../websocket/websocket.service';
import { GameStateService } from './game-state.service';

// Pas de redirection en « Déconnecté » : aucune partie n'est connue (CA-29).
export const noActiveGameGuard: CanActivateFn = () => {
  const gameState = inject(GameStateService);
  if (!gameState.isPiloting() || inject(WebSocketService).isDisconnected())
    return true;

  return inject(Router).parseUrl(gameState.status() === 'PENDING' ? '/pilot/lobby' : '/pilot/play');
};
