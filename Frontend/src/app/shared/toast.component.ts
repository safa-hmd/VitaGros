import { Component, inject } from '@angular/core';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="toast-stack">
      @for (t of toast.toasts(); track t.id) {
        <div [class]="'toast ' + t.kind" (click)="toast.dismiss(t.id)">{{ t.message }}</div>
      }
    </div>
  `
})
export class ToastComponent {
  readonly toast = inject(ToastService);
}
