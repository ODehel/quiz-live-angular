import { Routes } from '@angular/router';
import { authGuard } from './core/authentication/auth.guard';
import { Shell } from './core/layout/shell';
import { Dashboard } from './features/dashboard/dashboard';
import { Playground } from './features/playground/playground';
import { ThemeList } from './features/themes/theme-list';
import { errorPageGuard } from './core/error/error-page.guard';
import { ErrorPage } from './shared/ui/error-page/error-page';

export const routes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    // Les pages protégées par `authGuard` sont les enfants de cette route : elles portent la topbar (CA-35).
    {
        path: '',
        component: Shell,
        canActivate: [authGuard],
        children: [
            { path: 'dashboard', component: Dashboard },
            // Groupe Contenu (décision #101) : parent `content` sans `noActiveGameGuard`, qui n'existe pas encore (CA-22).
            { path: 'content', children: [{ path: 'themes', component: ThemeList }] }
        ]
    },
    { path: 'playground', component: Playground },
    { path: 'error', component: ErrorPage, canActivate: [errorPageGuard] }
];
