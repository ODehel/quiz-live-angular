import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { ToastService } from "./toast.service";
import { Toast } from "./toast";

@Component({
    selector: 'app-toast-container',
    template: `
        @for (notification of toastService.notifications(); track notification) {
        <app-toast [notification]="notification" (close)="toastService.remove(notification)" ></app-toast>
    }`,
    styles: `
    :host {
        position: fixed;
        bottom: 20px;
        right: 20px;
        display: flex;
        flex-direction: column-reverse;
        gap: 10px;
        max-width: 380px;
    }
    `,
    imports: [Toast],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastContainer {
    readonly toastService = inject(ToastService);
}