import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { ErrorService } from "../../../core/error/error.service";

@Component({
    selector: 'app-error-page',
    template: `
        @if (error()) {
            <div data-testid="error-screen"></div>
        }
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ErrorPage {
    private readonly errorService = inject(ErrorService);
    readonly error = this.errorService.currentError;
}