import { ApplicationConfig, provideBrowserGlobalErrorListeners, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { CircleAlert, CirclePlay, LogOut, LucideAngularModule, Play, Trash2, TriangleAlert, X, Check, ArrowLeft, WifiOff, ServerCrash, MapPinOff, OctagonAlert, Zap } from 'lucide-angular';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    importProvidersFrom(LucideAngularModule.pick({
      X, TriangleAlert, CircleAlert, CirclePlay, Play, Trash2, LogOut, Check, ArrowLeft, WifiOff, ServerCrash, MapPinOff, OctagonAlert,
      Zap
    }))
  ]
};
