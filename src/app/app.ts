import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainer } from './core/toast/toast-container';
import { ToastService } from './core/toast/toast.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainer],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('quiz-live-angular');
  private readonly toastService = inject(ToastService);
  constructor() {
    this.toastService.add({ message: 'Hello!', type: 'info' });
    this.toastService.add({ message: 'Erreur', type: 'error' });
    this.toastService.add({ message: 'Attention !', type: 'warning'})
    this.toastService.add({ message: 'Bravo !', type: 'success' });
  }
}
