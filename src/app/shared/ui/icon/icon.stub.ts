import { Component, input } from '@angular/core';

@Component({
  selector: 'app-icon',
  template: ''
})  
export class IconStub {
    readonly name = input.required<string>();
     readonly size = input<number | undefined>(undefined);
}