import { ChangeDetectionStrategy, Component, computed, inject } from "@angular/core";
import { ErrorContext, ErrorService } from "../../../core/error/error.service";
import { Icon } from "../icon/icon";

const MAIN_ICONS: Record<ErrorContext['variant'], string> = {
    "not-found": 'map-off',
    "connection-lost": 'wifi-off',
    "server-error": 'server-crash',
    "game-corrupted": 'alert-octagon'
};

@Component({
    selector: 'app-error-page',
    templateUrl: './error-page.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Icon]
})
export class ErrorPage {
    private readonly errorService = inject(ErrorService);
    readonly error = this.errorService.currentError;

    goHome(): void {
        this.errorService.clearError();
    }

    mainIconFor(variant: ErrorContext['variant']): string {
        return MAIN_ICONS[variant];
    }
}