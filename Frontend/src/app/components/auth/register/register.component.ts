import { Component, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, NgIf, RouterLink],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  firstname = '';
  lastname = '';
  email = '';
  password = '';
  confirm = '';
  error = signal('');
  success = signal(false);
  loading = signal(false);
  showPwd = signal(false);

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit() {
    this.error.set('');
    if (this.password !== this.confirm) {
      this.error.set('Les mots de passe ne correspondent pas.');
      return;
    }
    if (this.password.length < 6) {
      this.error.set('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    this.loading.set(true);
    this.auth.register({
      firstname: this.firstname,
      lastname: this.lastname,
      email: this.email,
      password: this.password
    }).subscribe({
      next: () => {
        this.success.set(true);
        setTimeout(() => this.router.navigate(['/dashboard']), 1200);
      },
      error: (e: any) => {
        this.loading.set(false);
        this.error.set(e.error?.message || e.message || 'Erreur lors de la création du compte.');
      }
    });
  }
}
