import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { Icon } from "../../shared/ui/icon/icon";

export interface ContextRow {
    key: string;
    value: string;
    tone?: 'normal' | 'warning' | 'danger';
}

export interface ConfirmOptions {
    title: string;
    confirmLabel: string;
    cancelLabel: string;
    message?: string;
    variant: 'destructive' | 'warning' | 'info';
    contextRows?: ContextRow[]
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
    imports: [Icon],
    host: { '[attr.data-variant]': 'variant' },
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmDialogComponent {
    private readonly dialogData = inject<ConfirmOptions>(DIALOG_DATA);
    private readonly dialogRef: DialogRef<boolean> = inject(DialogRef);

    readonly title = this.dialogData.title;
    readonly confirmLabel = this.dialogData.confirmLabel;
    readonly cancelLabel = this.dialogData.cancelLabel;
    readonly message = this.dialogData.message;
    readonly variant = this.dialogData.variant;
    readonly contextRows = this.dialogData.contextRows;
    readonly variantIcon = VARIANT_ICONS[this.variant];
    readonly confirmIcon = CONFIRM_ICONS[this.variant];
    
    cancel(): void { this.dialogRef.close(false); }
    confirm(): void { this.dialogRef.close(true); }
}