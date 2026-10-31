import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ToastNotification } from './toast.service';
import { Icon } from "../../shared/ui/icon/icon";

@Component({
  selector: 'app-toast',
  templateUrl: './toast.html',
  host: { '[class]': '"toast-" + notification().type' },
  styleUrl: './toast.scss',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Toast {
  readonly notification = input.required<ToastNotification>();
  // TODO(fix(toast)): rename; `close` collides with the native DOM event (dette connue, traitée à part)
  // eslint-disable-next-line @angular-eslint/no-output-native
  readonly close = output<void>();
}