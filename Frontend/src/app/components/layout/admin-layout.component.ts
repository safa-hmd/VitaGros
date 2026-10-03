import { Component, signal } from '@angular/core';
import { NgIf, NgClass } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf, NgClass],
  templateUrl: './admin-layout.component.html',
  styles: [`
    .admin-container {
      display: flex;
      min-height: 100vh;
      background: #090d16;
    }
    .admin-sidebar {
      width: 260px;
      background: #111827;
      border-right: 1px solid #1f2937;
      display: flex;
      flex-direction: column;
      position: sticky;
      top: 0;
      height: 100vh;
      flex-shrink: 0;
      transition: width 0.25s ease;
      z-index: 100;
    }
    .admin-sidebar-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #1f2937;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .admin-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
      color: #fff;
      font-weight: 700;
      font-size: 1.1rem;
    }
    .admin-nav {
      flex: 1;
      padding: 1rem 0.75rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .admin-nav-category {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6b7280;
      padding: 0.75rem 0.75rem 0.25rem;
      font-weight: 600;
    }
    .admin-nav-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.6rem 0.85rem;
      color: #9ca3af;
      text-decoration: none;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.15s ease;
    }
    .admin-nav-link:hover {
      color: #fff;
      background: rgba(99, 102, 241, 0.1);
    }
    .admin-nav-link.active {
      color: #fff;
      background: #4f46e5;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35);
    }
    .admin-sidebar-footer {
      padding: 1rem;
      border-top: 1px solid #1f2937;
      background: #0f172a;
    }
    .admin-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .admin-header {
      height: 64px;
      background: rgba(17, 24, 39, 0.9);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid #1f2937;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
      position: sticky;
      top: 0;
      z-index: 90;
    }
    .admin-content {
      flex: 1;
      padding: 2rem;
      overflow-y: auto;
    }
    .btn-preview-shop {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.6rem;
      border-radius: 8px;
      background: rgba(14, 165, 233, 0.15);
      color: #38bdf8;
      border: 1px solid rgba(14, 165, 233, 0.3);
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    .btn-preview-shop:hover {
      background: rgba(14, 165, 233, 0.25);
    }
  `]
})
export class AdminLayoutComponent {
  userInitials = signal('AD');
  adminName = signal('Admin');

  constructor(private auth: AuthService) {
    const u = this.auth.currentUser();
    if (u) {
      this.adminName.set(`${u.firstname} ${u.lastname}`);
      this.userInitials.set(
        (u.firstname?.[0] || 'A').toUpperCase() + (u.lastname?.[0] || 'D').toUpperCase()
      );
    }
  }

  logout() {
    this.auth.logout();
  }
}
