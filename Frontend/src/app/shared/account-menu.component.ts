import { Component, HostListener, Input, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Nom de l'utilisateur dans le header : clic = petite liste (Profil / Déconnexion). */
@Component({
  selector: 'app-account-menu',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (user(); as u) {
      <div class="account">
        <button type="button" class="account-btn" (click)="toggle($event)">
          <span class="avatar">{{ initials() }}</span>
          <span class="account-name">{{ u.firstname }} {{ u.lastname }}</span>
          <span class="caret">▾</span>
        </button>
        @if (open()) {
          <div class="dropdown" (click)="$event.stopPropagation()">
            <a [routerLink]="profileLink" (click)="open.set(false)">👤 Profil</a>
            <button type="button" class="danger-link" (click)="auth.logout()">🚪 Déconnexion</button>
          </div>
        }
      </div>
    }
  `
})
export class AccountMenuComponent {
  @Input({ required: true }) profileLink = '';

  readonly auth = inject(AuthService);
  readonly user = this.auth.currentUser;
  readonly open = signal(false);
  readonly initials = computed(() => {
    const u = this.user();
    return u ? (u.firstname.charAt(0) + u.lastname.charAt(0)).toUpperCase() : '';
  });

  toggle(event: Event): void {
    event.stopPropagation();
    this.open.update(v => !v);
  }

  @HostListener('document:click')
  close(): void {
    this.open.set(false);
  }
}
