import { Component, input, output } from '@angular/core';
import { ToastNotification } from './toast.service';
import { Icon } from "../../shared/ui/icon/icon";

@Component({
  selector: 'app-toast',
  templateUrl: './toast.html',
  host: { '[class]': '"toast-" + notification().type' },
  styleUrl: './toast.scss',
  imports: [Icon]
})
export class Toast {
  readonly notification = input.required<ToastNotification>();
  readonly close = output<void>();
}