import { ApplicationConfig, provideBrowserGlobalErrorListeners, importProvidersFrom, provideAppInitializer, provideEnvironmentInitializer, effect, inject } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { CircleAlert, CirclePlay, LogOut, LucideAngularModule, Play, Trash2, TriangleAlert, X, Check, ArrowLeft, WifiOff, ServerCrash, MapPinOff, OctagonAlert, Zap, ShieldX, House } from 'lucide-angular';
import { routes } from './app.routes';
import { authInterceptor } from './core/authentication/auth.interceptor';
import { AuthService } from './core/authentication/auth.service';
import { ErrorService } from './core/error/error.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    importProvidersFrom(LucideAngularModule.pick({
      X, TriangleAlert, CircleAlert, CirclePlay, Play, Trash2, LogOut, Check, ArrowLeft, WifiOff, ServerCrash, MapPinOff, OctagonAlert,
      Zap, ShieldX, House
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
    provideAppInitializer(() => inject(AuthService).initialize())
  ]
};
