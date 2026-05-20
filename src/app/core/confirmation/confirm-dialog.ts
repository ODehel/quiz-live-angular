import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { ChangeDetectionStrategy, Component, computed, inject, signal } from "@angular/core";
import { Icon } from "../../shared/ui/icon/icon";
import { filter, fromEvent } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

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
    contextRows?: ContextRow[];
    requireTyping?: string;
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
    host: { '[attr.data-variant]': 'dialogData.variant' },
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmDialogComponent {
    readonly dialogData = inject<ConfirmOptions>(DIALOG_DATA);
    private readonly dialogRef: DialogRef<boolean> = inject(DialogRef);

    readonly variantIcon = VARIANT_ICONS[this.dialogData.variant];
    readonly confirmIcon = CONFIRM_ICONS[this.dialogData.variant];
    readonly typedConfirmation = signal<string>("");
    readonly confirmDisabled = computed(() =>
        !!this.dialogData.requireTyping
        && this.typedConfirmation() !== this.dialogData.requireTyping
    );

    constructor() {
        fromEvent<KeyboardEvent>(document, 'keydown')
            .pipe(
                filter(e => e.key === 'Escape'),
                takeUntilDestroyed()
            )
            .subscribe(() => this.cancel());
    }

    cancel(): void { this.dialogRef.close(false); }
    confirm(): void { this.dialogRef.close(true); }
}