import { DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, inject } from "@angular/core";

@Component({ template: '{{title}}' })
export class ConfirmDialogComponent {
    readonly title = inject<{ title: string }>(DIALOG_DATA).title;
}