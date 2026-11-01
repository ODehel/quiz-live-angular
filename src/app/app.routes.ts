import { Routes } from '@angular/router';
import { Playground } from './features/playground/playground';
import { ErrorPage } from './shared/ui/error-page/error-page';

export const routes: Routes = [
    { path: 'playground', component: Playground },
    { path: 'error', component: ErrorPage }
];
