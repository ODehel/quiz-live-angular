import { Injectable } from "@angular/core";
import { ErrorContext } from "../../../core/error/error.service";
import { ErrorVariantConfig } from "./error-page";

const VARIANT_CONFIGS: Record<ErrorContext['variant'], ErrorVariantConfig> = {
    "not-found": {
        icon: "map-pin-off",
        eyebrow: "Erreur 404",
        titleSegments: [
            { content: "Cette page n'existe " },
            { content: "pas (encore)", colored: true }
        ],
        message: "Le lien est cassé ou la ressource a été supprimée."
    },
    "connection-lost": {
        icon: "wifi-off",
        eyebrow: "Connexion perdue",
        titleSegments: [
            { content: "Le hub " },
            { content: "ne répond plus", colored: true }
        ],
        message: "L'application n'arrive plus à communiquer avec le serveur. Tentative de reconnexion auto en cours."
    },
    "server-error": {
        icon: "server-crash",
        eyebrow: "Erreur 500 · Serveur",
        titleSegments: [
            { content: "Le serveur a " },
            { content: "rencontré un problème", colored: true }
        ],
        message: "Une erreur inattendue s'est produite côté hub. L'incident a été enregistré dans les logs."
    },
    "game-corrupted": {
        icon: "octagon-alert",
        eyebrow: "Incident critique",
        titleSegments: [
            { content: "Cette partie est " },
            { content: "corrompue", colored: true }
        ],
        message: "L'état de la partie est devenu incohérent et ne peut pas être restauré. Les scores jusqu'ici sont conservés."
    }
};

@Injectable({ providedIn: 'root' })
export class VariantConfigurationService {
    configFor(variant: ErrorContext['variant']): ErrorVariantConfig {
        return VARIANT_CONFIGS[variant];
    }
}