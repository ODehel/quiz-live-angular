import { Component, input, output } from '@angular/core';
import { ToastNotification } from './toast.service';

@Component({
  selector: 'app-toast',
  template: `<div><button data-testid="close" (click)="close.emit()">X</button>{{ notification().message }}</div>`,
  host: { '[class]': '"toast-" + notification().type' },
  styleUrl: './toast.scss'
})
export class Toast {
  readonly notification = input.required<ToastNotification>();
  readonly close = output<void>();
}