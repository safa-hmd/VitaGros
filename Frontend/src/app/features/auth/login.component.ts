import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Role } from '../../models/user.model';
import { errorMessage } from '../../core/http-error';

/** Une seule page, deux usages : client (/auth/login) et administrateur (/auth/admin-login). */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-wrap">
      <div class="card auth-card">
        <div class="auth-brand">🛒 VitaGros</div>
        <h2>{{ isAdmin ? 'Espace administrateur' : 'Connexion' }}</h2>
        <p class="muted">{{ isAdmin ? 'Réservé aux comptes administrateurs.' : 'Connectez-vous pour commander.' }}</p>

        <form class="stack" (ngSubmit)="submit()">
          <label>Email
            <input type="email" name="email" [(ngModel)]="email" required autocomplete="username">
          </label>
          <label>Mot de passe
            <input type="password" name="password" [(ngModel)]="password" required autocomplete="current-password">
          </label>
          @if (error()) {
            <div class="alert error">{{ error() }}</div>
          }
          <button class="btn btn-primary btn-block" type="submit" [disabled]="loading() || !email || !password">
            {{ loading() ? 'Connexion…' : 'Se connecter' }}
          </button>
        </form>

        @if (isAdmin) {
          <p class="center"><a routerLink="/auth/login">← Connexion client</a></p>
        } @else {
          <p class="muted center">Pas encore de compte ? <a routerLink="/auth/register">Créer un compte</a></p>
          <p class="center small"><a routerLink="/auth/admin-login">Connexion administrateur</a></p>
        }
      </div>
    </div>
  `
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly portal: Role = (this.route.snapshot.data['portal'] as Role | undefined) ?? Role.USER;
  readonly isAdmin = this.portal === Role.ADMIN;

  email = '';
  password = '';
  readonly error = signal('');
  readonly loading = signal(false);

  submit(): void {
    this.error.set('');
    this.loading.set(true);
    this.auth.login({ email: this.email.trim(), password: this.password, portal: this.portal }).subscribe({
      next: () => this.router.navigate([this.auth.homeUrl()]),
      error: e => {
        this.loading.set(false);
        this.error.set(errorMessage(e, 'Email ou mot de passe incorrect.'));
      }
    });
  }
}
