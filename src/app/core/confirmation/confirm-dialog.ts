import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { Component, inject } from "@angular/core";

export interface ConfirmDialogData {
    title: string;
    confirmLabel: string;
    cancelLabel: string;
}

@Component({ templateUrl: './confirm-dialog.html' })
export class ConfirmDialogComponent {
    private readonly dialogData = inject<ConfirmDialogData>(DIALOG_DATA);
    readonly title = this.dialogData.title;
    readonly confirmLabel = this.dialogData.confirmLabel;
    readonly cancelLabel = this.dialogData.cancelLabel;
    readonly dialogRef: DialogRef<boolean> = inject(DialogRef);
}