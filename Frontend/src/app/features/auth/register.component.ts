import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { errorMessage } from '../../core/http-error';
import { isEmail } from '../../core/validators';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-wrap">
      <div class="card auth-card">
        <div class="auth-brand">🛒 VitaGros</div>
        <h2>Créer un compte</h2>
        <p class="muted">Votre compte client vous permet de commander et suivre vos livraisons.</p>

        <form class="stack" (ngSubmit)="submit()">
          <div class="row">
            <label class="grow">Prénom
              <input name="firstname" [(ngModel)]="form.firstname" required>
            </label>
            <label class="grow">Nom
              <input name="lastname" [(ngModel)]="form.lastname" required>
            </label>
          </div>
          <label>Email
            <input type="email" name="email" [(ngModel)]="form.email" required>
          </label>
          <label>Mot de passe <span class="muted small">(6 caractères minimum)</span>
            <input type="password" name="password" [(ngModel)]="form.password" required>
          </label>
          <label>Confirmer le mot de passe
            <input type="password" name="confirm" [(ngModel)]="confirm" required>
          </label>
          @if (error()) {
            <div class="alert error">{{ error() }}</div>
          }
          <button class="btn btn-primary btn-block" type="submit" [disabled]="loading()">
            {{ loading() ? 'Création…' : 'Créer mon compte' }}
          </button>
        </form>
        <p class="muted center">Déjà inscrit ? <a routerLink="/auth/login">Se connecter</a></p>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  form = { firstname: '', lastname: '', email: '', password: '' };
  confirm = '';
  readonly error = signal('');
  readonly loading = signal(false);

  submit(): void {
    this.error.set('');
    const f = this.form;
    if (!f.firstname.trim() || !f.lastname.trim()) return this.fail('Prénom et nom sont obligatoires.');
    if (!isEmail(f.email)) return this.fail('Adresse email invalide.');
    if (f.password.length < 6) return this.fail('Le mot de passe doit contenir au moins 6 caractères.');
    if (f.password !== this.confirm) return this.fail('Les mots de passe ne correspondent pas.');

    this.loading.set(true);
    this.auth.register({
      firstname: f.firstname.trim(),
      lastname: f.lastname.trim(),
      email: f.email.trim(),
      password: f.password
    }).subscribe({
      next: () => this.router.navigate([this.auth.homeUrl()]),
      error: e => {
        this.loading.set(false);
        this.error.set(errorMessage(e, 'Inscription impossible.'));
      }
    });
  }

  private fail(message: string): void {
    this.error.set(message);
  }
}
