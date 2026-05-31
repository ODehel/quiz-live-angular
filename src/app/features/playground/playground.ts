import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { Button } from "../../shared/ui/button/button";
import { ConfirmationService } from "../../core/confirmation/confirmation.service";
import { ErrorService } from "../../core/error/error.service";

@Component({
    selector: 'app-playground',
    template: `<app-button (click)="openDestructive()">Ouvrir destructive</app-button>
    <app-button (click)="openWarning()">Ouvrir warning</app-button>
    <app-button (click)="openInfo()">Ouvrir info</app-button>
    <app-button (click)="showNotFoundErrorPage()">Page introuvable</app-button>
    <app-button (click)="showConnectionLostErrorPage()">Connexion perdue</app-button>
    <app-button (click)="showServerErrorPage()">Erreur 500</app-button>
    <app-button (click)="showGameCorruptedErrorPage()">Partie en erreur</app-button>`,
    imports: [Button],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Playground {
    private readonly confirmationService: ConfirmationService = inject(ConfirmationService);
    private readonly errorService: ErrorService = inject(ErrorService);

    openDestructive(): void {
        this.confirmationService.ask({
            title: "Annuler la partie en cours ?",
            message: "Cette action est irréversible. Les scores et la progression seront perdus définitivement.",
            contextRows: [
                { key: "Quiz", value: "Soirée découverte du monde" },
                { key: "Progression", value: "8 / 12 questions jouées", tone: "warning" },
                { key: "Joueurs actifs", value: "10 connectés" },
                { key: "Scores cumulés", value: "Seront supprimés", tone: "danger" }
            ],
            requireTyping: "ANNULER",
            confirmLabel: "Oui, annuler",
            cancelLabel: "Continuer la partie",
            variant: "destructive"
        });
    }
    openWarning(): void {
        this.confirmationService.ask({
            title: "Quitter sans sauvegarder ?",
            message: "Vous avez des modifications non enregistrées sur cette question. Si vous quittez maintenant, elles seront perdues.",
            contextRows: [
                { key: "Question", value: "Q.5 · MCQ Cinéma" },
                { key: "Modifications", value: "Énoncé + 2 réponses modifiées", tone: "warning" },
                { key: "Dernière sauvegarde", value: "il y a 4 minutes" }
            ],
            confirmLabel: "Quitter quand même",
            cancelLabel: "Continuer l'édition",
            cancelIcon: "arrow-left",
            variant: "warning"
        });
    }
    openInfo(): void {
        this.confirmationService.ask({
            title: "Lancer la partie maintenant ?",
            message: "Un joueur n'est pas encore connecté. Vous pouvez démarrer sans lui : il pourra rejoindre dès que son buzzer sera détecté.",
            contextRows: [
                { key: "Connectés", value: "9/10 buzzers" },
                { key: "En attente", value: "Ali - b10 - Indigo", tone: "warning" },
                { key: "Quiz", value: "Soirée découverte du monde" }
            ],
            confirmLabel: "Lancer maintenant",
            cancelLabel: "Attendre encore",
            variant: "info"
        });
    }

    showNotFoundErrorPage(): void {
        this.errorService.notFound();
    }

    showConnectionLostErrorPage(): void {
        this.errorService.connectionLost();
    }

    showServerErrorPage(): void {
        this.errorService.serverError();
    }

    showGameCorruptedErrorPage(): void {
        this.errorService.gameCorrupted();
    }
}