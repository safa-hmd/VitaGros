import { Component, OnInit, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProductService } from '../../services/product.service';
import { OrderService } from '../../services/order.service';
import { UserService } from '../../services/user.service';

interface StatCard {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  link: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  stats = signal<StatCard[]>([]);
  userName = signal('');
  today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  constructor(
    private auth: AuthService,
    private productService: ProductService,
    private orderService: OrderService,
    private userService: UserService
  ) {}

  ngOnInit() {
    const user = this.auth.currentUser();
    this.userName.set(user ? `${user.firstname} ${user.lastname}` : 'Admin');

    // Load stats from microservices
    this.stats.set([
      { label: 'Produits', value: '...', icon: '📦', color: 'blue', link: '/products' },
      { label: 'Commandes', value: '...', icon: '🛒', color: 'green', link: '/orders' },
      { label: 'Utilisateurs', value: '...', icon: '👥', color: 'purple', link: '/users' },
      { label: 'Livraisons', value: '...', icon: '🚚', color: 'orange', link: '/deliveries' },
    ]);

    this.productService.getAllProducts().subscribe({
      next: (p) => this.updateStat('Produits', p.length),
      error: () => this.updateStat('Produits', 'N/A')
    });
    this.orderService.getAllOrders().subscribe({
      next: (o) => this.updateStat('Commandes', o.length),
      error: () => this.updateStat('Commandes', 'N/A')
    });
    this.userService.getAll().subscribe({
      next: (u) => this.updateStat('Utilisateurs', u.length),
      error: () => this.updateStat('Utilisateurs', 'N/A')
    });
  }

  private updateStat(label: string, value: number | string) {
    this.stats.update(stats => stats.map(s => s.label === label ? { ...s, value } : s));
  }
}
