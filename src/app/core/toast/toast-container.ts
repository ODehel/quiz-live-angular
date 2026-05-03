import { Component, inject } from "@angular/core";
import { ToastService } from "./toast.service";
import { Toast } from "./toast";

@Component({
    selector: 'app-toast-container',
    template: `
        @for (notification of toastService.notifications(); track notification) {
        <app-toast [notification]="notification" (close)="toastService.remove(notification)" ></app-toast>
    }`,
    imports: [Toast]
})
export class ToastContainer {
    readonly toastService = inject(ToastService);
}