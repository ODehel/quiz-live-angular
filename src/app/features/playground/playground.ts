import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { Button } from "../../shared/ui/button/button";
import { ConfirmationService } from "../../core/confirmation/confirmation.service";

@Component({
    selector: 'app-playground',
    template: `<app-button (click)="openDestructive()">Ouvrir destructive</app-button>
    <app-button (click)="openWarning()">Ouvrir warning</app-button>
    <app-button (click)="openInfo()">Ouvrir info</app-button>`,
    imports: [Button],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Playground {
    private readonly confirmationService: ConfirmationService = inject(ConfirmationService);

    openDestructive(): void {
        this.confirmationService.ask({
            title: "Annuler la partie en cours ?",
            confirmLabel: "Oui, annuler",
            cancelLabel: "Continuer la partie",
            variant: "destructive"
        });
    }
    openWarning(): void {
        this.confirmationService.ask({
            title: "Quitter sans sauvegarder ?",
            confirmLabel: "Quitter quand même",
            cancelLabel: "Continuer l'édition",
            variant: "warning"
        });
    }
    openInfo(): void {
        this.confirmationService.ask({
            title: "Lancer la partie maintenant ?",
            confirmLabel: "Lancer maintenant",
            cancelLabel: "Attendre encore",
            variant: "info"
        });
    }
}