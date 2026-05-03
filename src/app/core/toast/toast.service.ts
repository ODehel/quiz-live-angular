import { Injectable, signal } from "@angular/core";

export type ToastNotification = {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
};

@Injectable({ providedIn: 'root' })
export class ToastService {
    readonly notifications = signal<ToastNotification[]>([]);

    add(notification: ToastNotification): boolean {
        if (this.notifications().length < 5) {
            this.notifications.update(current => [...current, notification]);
            if (notification.duration !== undefined) {
                setTimeout(() => { this.remove(notification) }, notification.duration);
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