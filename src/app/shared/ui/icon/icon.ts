import { Component, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-icon',
  template: '<lucide-icon [name]="name()" />',
  imports: [LucideAngularModule]
})  
export class Icon {
    readonly name = input.required<string>();
}