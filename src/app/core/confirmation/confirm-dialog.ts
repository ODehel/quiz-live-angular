import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { Component, inject } from "@angular/core";

@Component({ templateUrl: './confirm-dialog.html' })
export class ConfirmDialogComponent {
    readonly title = inject<{ title: string }>(DIALOG_DATA).title;
    readonly dialogRef: DialogRef<boolean> = inject(DialogRef);
}