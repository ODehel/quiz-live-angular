import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { Component, inject } from "@angular/core";

@Component({ template: '{{title}}<button (click)="dialogRef.close(false)">Annuler</button><button (click)="dialogRef.close(true)">Confirmer</button>' })
export class ConfirmDialogComponent {
    readonly title = inject<{ title: string }>(DIALOG_DATA).title;
    readonly dialogRef: DialogRef<boolean> = inject(DialogRef);
}