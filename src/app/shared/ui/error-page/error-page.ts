import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { ErrorContext, ErrorService } from "../../../core/error/error.service";
import { Icon } from "../icon/icon";
import { Router } from "@angular/router";

export interface ErrorVariantConfig {
    icon: string;
    eyebrow: string;
    title: string;
    message: string;
}

const VARIANT_CONFIGS: Record<ErrorContext['variant'], ErrorVariantConfig> = {
    "not-found": {
        icon: "map-pin-off",
        eyebrow: "Erreur 404",
        title: "Cette page n'existe pas (encore)",
        message: "Le lien est cassé ou la ressource a été supprimée."
    },
    "connection-lost": {
        icon: "wifi-off",
        eyebrow: "Connexion perdue",
        title: "Le hub ne répond plus",
        message: "L'application n'arrive plus à communiquer avec le serveur. Tentative de reconnexion auto en cours."
    },
    "server-error": {
        icon: "server-crash",
        eyebrow: "Erreur 500 · Serveur",
        title: "Le serveur a rencontré un problème",
        message: "Une erreur inattendue s'est produite côté hub. L'incident a été enregistré dans les logs."
    },
    "game-corrupted": {
        icon: "octagon-alert",
        eyebrow: "Incident critique",
        title: "Cette partie est corrompue",
        message: "L'état de la partie est devenu incohérent et ne peut pas être restauré. Les scores jusqu'ici sont conservés."
    }
};

@Component({
    selector: 'app-error-page',
    templateUrl: './error-page.html',
    styleUrl: './error-page.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Icon]
})
export class ErrorPage {
    private readonly errorService = inject(ErrorService);
    private readonly router = inject(Router);
    readonly error = this.errorService.currentError;

    goHome(): void {
        this.errorService.clearError();
        this.router.navigate(['/']);
    }

    configFor(variant: ErrorContext['variant']): ErrorVariantConfig {
        return VARIANT_CONFIGS[variant];
    }
}