import { Component, output } from "@angular/core";

@Component({
    selector: 'app-button',
    template: '<button (click)="click.emit()"><ng-content /></button>'
})
export class Button {
    readonly click = output<void>();
}