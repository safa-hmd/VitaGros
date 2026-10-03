import { Component, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { Role } from '../../../models/user.model';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [FormsModule, NgIf, RouterLink],
  templateUrl: './admin-login.component.html'
})
export class AdminLoginComponent {
  email = '';
  password = '';
  error = signal('');
  loading = signal(false);
  showPwd = signal(false);

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit() {
    this.error.set('');
    this.loading.set(true);

    this.auth.login({ email: this.email, password: this.password }, Role.ADMIN).subscribe({
      next: () => {
        this.router.navigate(['/admin/dashboard']);
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e.message || e.error?.message || 'Identifiants administrateur invalides.');
      }
    });
  }

  fillAdminDemo() {
    this.email = 'admin@vitagros.com';
    this.password = 'admin123';
  }
}
