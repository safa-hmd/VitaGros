import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AccountMenuComponent } from '../shared/account-menu.component';

/** Espace administrateur (back-office) */
@Component({
  selector: 'app-back-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AccountMenuComponent],
  template: `
    <div class="admin-shell">
      <aside class="sidebar">
        <div class="brand">🛒 VitaGros <small>Back-office</small></div>
        <nav>
          <a routerLink="/admin/dashboard" routerLinkActive="active">📊 Tableau de bord</a>
          <a routerLink="/admin/produits" routerLinkActive="active">📦 Produits</a>
          <a routerLink="/admin/categories" routerLinkActive="active">🏷️ Catégories</a>
          <a routerLink="/admin/utilisateurs" routerLinkActive="active">👥 Utilisateurs</a>
          <a routerLink="/admin/commandes" routerLinkActive="active">🧾 Commandes</a>
          <a routerLink="/admin/livreurs" routerLinkActive="active">🚚 Livreurs</a>
        </nav>
      </aside>
      <div class="admin-main">
        <header class="topbar">
          <span class="grow muted">Espace administration</span>
          <app-account-menu profileLink="/admin/profil"></app-account-menu>
        </header>
        <main class="page">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class BackLayoutComponent {}
