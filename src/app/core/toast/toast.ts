import { Component, input, output } from '@angular/core';
import { ToastNotification } from './toast.service';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.html',
  host: { '[class]': '"toast-" + notification().type' },
  styleUrl: './toast.scss'
})
export class Toast {
  readonly notification = input.required<ToastNotification>();
  readonly close = output<void>();
}