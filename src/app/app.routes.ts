import { Routes } from '@angular/router';
import { authGuard } from './core/authentication/auth.guard';
import { Dashboard } from './features/dashboard/dashboard';
import { Playground } from './features/playground/playground';
import { ThemeList } from './features/themes/theme-list';
import { ErrorPage } from './shared/ui/error-page/error-page';

export const routes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
    { path: 'themes', component: ThemeList, canActivate: [authGuard] },
    { path: 'playground', component: Playground },
    { path: 'error', component: ErrorPage }
];
