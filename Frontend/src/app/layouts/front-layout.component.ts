import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AccountMenuComponent } from '../shared/account-menu.component';
import { CartService } from '../services/cart.service';

/** Espace client (front-office) */
@Component({
  selector: 'app-front-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AccountMenuComponent],
  template: `
    <header class="topbar">
      <a routerLink="/shop" class="brand">🛒 VitaGros</a>
      <nav class="topnav">
        <a routerLink="/shop" [routerLinkActiveOptions]="{ exact: true }" routerLinkActive="active">Accueil</a>
        <a routerLink="/shop/recommandations" routerLinkActive="active">🤖 Recommandations IA</a>
        <a routerLink="/shop/commandes" routerLinkActive="active">📦 Mes commandes</a>
        <a routerLink="/shop/panier" routerLinkActive="active" class="cart-link">
          🛒 Panier
          @if (cart.totalCount() > 0) {
            <span class="count">{{ cart.totalCount() }}</span>
          }
        </a>
      </nav>
      <app-account-menu profileLink="/shop/profil"></app-account-menu>
    </header>
    <main class="page">
      <router-outlet></router-outlet>
    </main>
  `
})
export class FrontLayoutComponent {
  readonly cart = inject(CartService);
}
