import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { Component, inject } from "@angular/core";
import { Icon } from "../../shared/ui/icon/icon";

export interface ConfirmOptions {
    title: string;
    confirmLabel: string;
    cancelLabel: string;
    message?: string;
    variant: 'destructive' | 'warning' | 'info';
}

const VARIANT_ICONS: Record<ConfirmOptions['variant'], string> = {
    info: 'circle-play',
    destructive: 'triangle-alert',
    warning: 'circle-alert'
};

const CONFIRM_ICONS: Record<ConfirmOptions['variant'], string> = {
    info: 'play',
    destructive: 'trash-2',
    warning: 'log-out'
};

@Component({
    templateUrl: './confirm-dialog.html',
    imports: [Icon]
})
export class ConfirmDialogComponent {
    private readonly dialogData = inject<ConfirmOptions>(DIALOG_DATA);
    readonly title = this.dialogData.title;
    readonly confirmLabel = this.dialogData.confirmLabel;
    readonly cancelLabel = this.dialogData.cancelLabel;
    readonly message = this.dialogData.message;
    readonly variant = this.dialogData.variant;
    readonly dialogRef: DialogRef<boolean> = inject(DialogRef);
    readonly variantIcon = VARIANT_ICONS[this.variant];
    readonly confirmIcon = CONFIRM_ICONS[this.variant];
}