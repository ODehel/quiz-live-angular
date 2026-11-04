import { ChangeDetectionStrategy, Component } from "@angular/core";

@Component({
    selector: 'app-dashboard',
    template: `<h1 data-testid="dashboard">Tableau de bord</h1>`,
    styleUrl: './dashboard.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Dashboard {}
