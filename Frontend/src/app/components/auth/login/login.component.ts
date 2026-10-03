import { Component, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { Role } from '../../../models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgIf, RouterLink],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  email = '';
  password = '';
  error = signal('');
  loading = signal(false);
  showPwd = signal(false);

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit() {
    this.error.set('');
    this.loading.set(true);
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        if (res.user.role === Role.ADMIN) {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/shop']);
        }
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e.message || e.error?.message || 'Email ou mot de passe incorrect.');
      }
    });
  }

  fillUserDemo() {
    this.email = 'client@vitagros.com';
    this.password = 'client123';
  }
}
