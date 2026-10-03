import { Component, OnInit, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, NgIf],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  form: User = { firstname: '', lastname: '', email: '' };
  newPassword = '';
  error = signal('');
  success = signal(false);
  saving = signal(false);
  showPwd = signal(false);

  initials = signal('??');

  constructor(
    private auth: AuthService,
    private userService: UserService
  ) {}

  ngOnInit() {
    const user = this.auth.currentUser();
    if (user) {
      this.form = { ...user };
      this.updateInitials();
    }
  }

  updateInitials() {
    const f = this.form.firstname?.[0]?.toUpperCase() || '';
    const l = this.form.lastname?.[0]?.toUpperCase() || '';
    this.initials.set(f + l || '??');
  }

  resetForm() {
    const user = this.auth.currentUser();
    if (user) this.form = { ...user };
    this.newPassword = '';
    this.error.set('');
    this.success.set(false);
  }

  save() {
    this.error.set('');
    this.success.set(false);
    this.saving.set(true);

    const payload: User = { ...this.form };
    if (this.newPassword.trim()) {
      payload.password = this.newPassword;
    }

    const id = this.form.id;
    if (!id) {
      this.error.set('Utilisateur non identifié.');
      this.saving.set(false);
      return;
    }

    this.userService.update(id, payload).subscribe({
      next: (updated) => {
        this.auth.updateCurrentUser(updated);
        this.form = { ...updated };
        this.newPassword = '';
        this.updateInitials();
        this.success.set(true);
        this.saving.set(false);
        setTimeout(() => this.success.set(false), 3000);
      },
      error: (e) => {
        this.saving.set(false);
        this.error.set(e.error?.message || 'Erreur lors de la mise à jour.');
      }
    });
  }
}
