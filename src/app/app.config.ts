import { ApplicationConfig, provideBrowserGlobalErrorListeners, importProvidersFrom, provideAppInitializer, inject } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { CircleAlert, CirclePlay, LogOut, LucideAngularModule, Play, Trash2, TriangleAlert, X, Check, ArrowLeft, WifiOff, ServerCrash, MapPinOff, OctagonAlert, Zap, ShieldX } from 'lucide-angular';
import { routes } from './app.routes';
import { authInterceptor } from './core/authentication/auth.interceptor';
import { AuthService } from './core/authentication/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    importProvidersFrom(LucideAngularModule.pick({
      X, TriangleAlert, CircleAlert, CirclePlay, Play, Trash2, LogOut, Check, ArrowLeft, WifiOff, ServerCrash, MapPinOff, OctagonAlert,
      Zap, ShieldX
    })),
    provideAppInitializer(() => inject(AuthService).initialize())
  ]
};
