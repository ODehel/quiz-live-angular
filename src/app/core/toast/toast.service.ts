import { inject, Injectable, signal } from "@angular/core";
import { TIMER } from "../timer/timer";

export type ToastNotification = {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
};

@Injectable({ providedIn: 'root' })
export class ToastService {
    private readonly timer = inject(TIMER);
    readonly notifications = signal<ToastNotification[]>([]);

    add(notification: ToastNotification): boolean {
        if (this.notifications().length < 5) {
            this.notifications.update(current => [...current, notification]);
            if (notification.duration !== undefined) {
                this.timer.schedule(() => { this.remove(notification) }, notification.duration);
            }
            return true;
        } else {
            return false;
        }
    }

    remove(notification: ToastNotification): void {
        this.notifications.update(current => current.filter(t => t !== notification));    
    }
}