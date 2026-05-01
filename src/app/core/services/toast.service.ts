import { signal } from "@angular/core";

export type Toast = {
    message: string;
    type: 'success' | 'error' | 'info';
    duration?: number;
};

export class ToastService {
    readonly notifications = signal<Toast[]>([]);

    add(notification: Toast): boolean {
        if (this.notifications().length < 5) {
            this.notifications.update(current => [...current, notification]);
            if (notification.duration !== undefined) {
                setTimeout(() => {
                    this.notifications.update(current => current.filter(t => t !== notification));
                }, notification.duration);
            }
            return true;
        } else {
            return false;
        }
    }
}