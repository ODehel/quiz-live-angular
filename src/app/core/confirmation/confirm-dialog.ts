import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { Component, inject } from "@angular/core";
import { Icon } from "../../shared/ui/icon/icon";

export interface ConfirmDialogData {
    title: string;
    confirmLabel: string;
    cancelLabel: string;
    message?: string;
}

@Component({
    templateUrl: './confirm-dialog.html',
    imports: [Icon]
})
export class ConfirmDialogComponent {
    private readonly dialogData = inject<ConfirmDialogData>(DIALOG_DATA);
    readonly title = this.dialogData.title;
    readonly confirmLabel = this.dialogData.confirmLabel;
    readonly cancelLabel = this.dialogData.cancelLabel;
    readonly message = this.dialogData.message;
    readonly dialogRef: DialogRef<boolean> = inject(DialogRef);
}