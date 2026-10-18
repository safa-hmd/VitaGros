import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';
import { Role, User } from '../../models/user.model';
import { errorMessage } from '../../core/http-error';
import { isEmail } from '../../core/validators';

/** Profil partagé : client (/shop/profil) et administrateur (/admin/profil). */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page-head">
      <h1>👤 Mon profil</h1>
      <span class="badge">{{ roleLabel }}</span>
    </div>

    <form class="card stack narrow" (ngSubmit)="save()">
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

      <h3>Changer le mot de passe</h3>
      <p class="muted small">Laissez vide pour conserver le mot de passe actuel.</p>
      <div class="row">
        <label class="grow">Nouveau mot de passe
          <input type="password" name="password" [(ngModel)]="form.password">
        </label>
        <label class="grow">Confirmation
          <input type="password" name="confirm" [(ngModel)]="form.confirm">
        </label>
      </div>

      @if (error()) {
        <div class="alert error">{{ error() }}</div>
      }
      <div class="actions">
        <button type="submit" class="btn btn-primary" [disabled]="saving()">
          {{ saving() ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
      </div>
    </form>
  `
})
export class ProfileComponent {
  private auth = inject(AuthService);
  private userApi = inject(UserService);
  private toast = inject(ToastService);

  private readonly user: User | null = this.auth.currentUser();
  readonly roleLabel = this.user?.role === Role.ADMIN ? 'Administrateur' : 'Client';

  form = {
    firstname: this.user?.firstname ?? '',
    lastname: this.user?.lastname ?? '',
    email: this.user?.email ?? '',
    password: '',
    confirm: ''
  };
  readonly saving = signal(false);
  readonly error = signal('');

  save(): void {
    this.error.set('');
    const f = this.form;
    if (!this.user?.id) return this.fail('Session expirée, reconnectez-vous.');
    if (!f.firstname.trim() || !f.lastname.trim()) return this.fail('Prénom et nom sont obligatoires.');
    if (!isEmail(f.email)) return this.fail('Adresse email invalide.');
    if (f.password && f.password.length < 6) return this.fail('Le nouveau mot de passe doit contenir au moins 6 caractères.');
    if (f.password !== f.confirm) return this.fail('Les mots de passe ne correspondent pas.');

    this.saving.set(true);
    this.userApi.update(this.user.id, {
      firstname: f.firstname.trim(),
      lastname: f.lastname.trim(),
      email: f.email.trim(),
      role: this.user.role,
      password: f.password || undefined
    }).subscribe({
      next: updated => {
        this.auth.updateCurrentUser({ ...updated, role: this.user!.role });
        this.form.password = '';
        this.form.confirm = '';
        this.saving.set(false);
        this.toast.show('Profil mis à jour.');
      },
      error: e => {
        this.saving.set(false);
        this.error.set(errorMessage(e, 'Mise à jour impossible.'));
      }
    });
  }

  private fail(message: string): void {
    this.error.set(message);
  }
}
