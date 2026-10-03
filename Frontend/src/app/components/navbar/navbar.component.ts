import { Component, signal, HostListener } from '@angular/core';
import { NgIf, NgClass } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  link?: string;
  children?: { label: string; link: string; icon: string }[];
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [NgIf, NgClass, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  menuOpen = signal(false);
  openDrop = signal<string | null>(null);
  scrolled = signal(false);

  userName = signal('');
  userInitials = signal('??');

  constructor(private auth: AuthService) {
    const user = this.auth.currentUser();
    if (user) {
      this.userName.set(`${user.firstname} ${user.lastname}`);
      this.userInitials.set(
        (user.firstname?.[0] || '').toUpperCase() + (user.lastname?.[0] || '').toUpperCase()
      );
    }
  }

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled.set(window.scrollY > 20);
  }

  toggleDrop(id: string) {
    this.openDrop.set(this.openDrop() === id ? null : id);
  }

  closeDrop() {
    this.openDrop.set(null);
    this.menuOpen.set(false);
  }

  logout() {
    this.auth.logout();
  }
}
