import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { ErrorContext, ErrorService } from "../../../core/error/error.service";
import { Icon } from "../icon/icon";
import { Router } from "@angular/router";
import { VariantConfigurationService } from "./variant-configuration.service";
import { AuthService } from "../../../core/authentication/auth.service";

export interface TitleSegment {
    content: string;
    colored?: boolean;
}

export interface ErrorVariantConfig {
    icon: string;
    eyebrow: string;
    titleSegments: TitleSegment[];
    message: string;
}

@Component({
    selector: 'app-error-page',
    templateUrl: './error-page.html',
    styleUrl: './error-page.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Icon]
})
export class ErrorPage {
    private readonly errorService = inject(ErrorService);
    private readonly variantConfigurationService = inject(VariantConfigurationService);
    private readonly router = inject(Router);
    private readonly authService = inject(AuthService);
    readonly error = this.errorService.currentError;

    goHome(): void {
        if (this.authService.isReady())
            this.errorService.clearError();
        this.router.navigate(['/']);
    }

    configFor(variant: ErrorContext['variant']): ErrorVariantConfig {
        return this.variantConfigurationService.configFor(variant);
    }
}