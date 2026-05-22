import { ChangeDetectionStrategy, Component } from "@angular/core";

@Component({
    selector: 'app-button',
    template: '<button><ng-content /></button>',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Button {
}