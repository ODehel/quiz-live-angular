import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainer } from './core/toast/toast-container';
import { ToastService } from './core/toast/toast.service';
import { ErrorPage } from "./shared/ui/error-page/error-page";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainer, ErrorPage],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  protected readonly title = signal('quiz-live-angular');
  private readonly toastService = inject(ToastService);
}
