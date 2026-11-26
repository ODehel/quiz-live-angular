import { ApplicationConfig, provideBrowserGlobalErrorListeners, importProvidersFrom, provideAppInitializer, provideEnvironmentInitializer, effect, inject } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { CircleAlert, CirclePlay, LogOut, LucideAngularModule, Play, Trash2, TriangleAlert, X, Check, ArrowLeft, WifiOff, ServerCrash, MapPinOff, OctagonAlert, Zap, ShieldX, House, AppWindow, FolderTree, Plus, RefreshCw, List, Clock, Image, Music } from 'lucide-angular';
import { routes } from './app.routes';
import { authInterceptor } from './core/authentication/auth.interceptor';
import { AuthService } from './core/authentication/auth.service';
import { ErrorService } from './core/error/error.service';
import { SERVER_ADDRESS, WEB_SOCKET_CONSTRUCTOR } from './core/websocket/websocket.providers';
import { serverAddress } from './core/websocket/server-address';
import { GameStateService } from './core/game-state/game-state.service';
import { WebSocketService } from './core/websocket/websocket.service';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    importProvidersFrom(LucideAngularModule.pick({
      X, TriangleAlert, CircleAlert, CirclePlay, Play, Trash2, LogOut, Check, ArrowLeft, WifiOff, ServerCrash, MapPinOff, OctagonAlert,
      Zap, ShieldX, House, AppWindow, FolderTree, Plus, RefreshCw, List, Clock, Image, Music
    })),
    provideEnvironmentInitializer(() => {
      const errorService = inject(ErrorService);
      const router = inject(Router);
      effect(() => {
        if (errorService.currentError()) {
          router.navigate(['/error']);
        }
      });
    }),
    {
      provide: WebSocketService,
      useFactory: () => {
        const errorService = inject(ErrorService);
        return new WebSocketService(
          inject(WEB_SOCKET_CONSTRUCTOR),
          environment.wsUrl,
          inject(AuthService),
          {
            goToError: cause => cause === 'connection-lost'
              ? errorService.connectionLost()
              : errorService.sessionReplaced()
          }
        );
      }
    },
    { provide: SERVER_ADDRESS, useValue: serverAddress(environment.wsUrl) },
    { provide: GameStateService, useFactory: () => new GameStateService(inject(WebSocketService)) },
    provideAppInitializer(async () => {
      const authService = inject(AuthService);
      const webSocketService = inject(WebSocketService);
      inject(GameStateService);
      await authService.initialize();
      if (authService.isReady()) {
        webSocketService.connect();
      }
    })
  ]
};
