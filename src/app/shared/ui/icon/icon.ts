import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-icon',
  template: '<lucide-icon [name]="name()" [size]="size()" />',
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})  
export class Icon {
    readonly name = input.required<string>();
     readonly size = input<number | undefined>(undefined);
}