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
        message: "Le lien que vous avez suivi est cassé ou la ressource a été supprimée. Vérifiez l'URL ou retournez à l'accueil pour repartir d'un endroit connu."
    },
    "connection-lost": {
        icon: "wifi-off",
        eyebrow: "Connexion perdue",
        titleSegments: [
            { content: "Le hub " },
            { content: "ne répond plus", colored: true }
        ],
        message: "L'application n'arrive plus à communiquer avec le serveur Quiz Buzzer. Cela peut être un problème temporaire de réseau ou un redémarrage du hub. Nous tentons une reconnexion automatique."
    },
    "invalid-credentials": {
        icon: "shield-x",
        eyebrow: "Authentification refusée",
        titleSegments: [
            { content: "Identifiants " },
            { content: "invalides", colored: true }
        ],
        message: "L'application n'a pas pu se connecter au serveur Quiz Buzzer. Les identifiants ne sont pas corrects."
    },
    "server-error": {
        icon: "server-crash",
        eyebrow: "Erreur 500 · Serveur",
        titleSegments: [
            { content: "Le serveur a " },
            { content: "rencontré un problème", colored: true }
        ],
        message: "Une erreur inattendue s'est produite côté hub. Ce n'est pas un problème lié à votre action — l'incident a été enregistré dans les logs et peut être consulté pour diagnostic."
    },
    "game-corrupted": {
        icon: "octagon-alert",
        eyebrow: "Incident critique",
        titleSegments: [
            { content: "Cette partie est " },
            { content: "corrompue", colored: true }
        ],
        message: "L'état de la partie « Soirée découverte du monde » est devenu incohérent et ne peut pas être restauré. Cela peut arriver suite à un crash du hub ou une déconnexion prolongée. Les scores enregistrés jusqu'ici sont conservés en sécurité."
    }
};

@Injectable({ providedIn: 'root' })
export class VariantConfigurationService {
    configFor(variant: ErrorContext['variant']): ErrorVariantConfig {
        return VARIANT_CONFIGS[variant];
    }
}