import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { ErrorService } from "../../../core/error/error.service";

@Component({
    selector: 'app-error-page',
    templateUrl: './error-page.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ErrorPage {
    private readonly errorService = inject(ErrorService);
    readonly error = this.errorService.currentError;
}