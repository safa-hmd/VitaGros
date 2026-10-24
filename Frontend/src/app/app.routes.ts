import { Routes } from '@angular/router';
import { guestGuard, roleGuard } from './core/guards/auth.guard';
import { Role } from './models/user.model';

/**
 * Toutes les pages sont chargées à la demande (lazy loading).
 * "ng serve -o" ouvre /  ->  /auth/login (ou l'espace de l'utilisateur déjà connecté).
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'auth/login' },

  // ---------- Authentification (publique)
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        canActivate: [guestGuard],
        data: { portal: Role.USER },
        loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'admin-login',
        canActivate: [guestGuard],
        data: { portal: Role.ADMIN },
        loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        canActivate: [guestGuard],
        loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent)
      },
      { path: '', pathMatch: 'full', redirectTo: 'login' }
    ]
  },

  // ---------- Espace client (front-office)
  {
    path: 'shop',
    canActivate: [roleGuard(Role.USER)],
    loadComponent: () => import('./layouts/front-layout.component').then(m => m.FrontLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./features/front/home.component').then(m => m.HomeComponent) },
      { path: 'recommandations', loadComponent: () => import('./features/front/recommendations.component').then(m => m.RecommendationsComponent) },
      { path: 'panier', loadComponent: () => import('./features/front/cart.component').then(m => m.CartComponent) },
      { path: 'commandes', loadComponent: () => import('./features/front/my-orders.component').then(m => m.MyOrdersComponent) },
      { path: 'profil', loadComponent: () => import('./features/shared/profile.component').then(m => m.ProfileComponent) },
      { path: '**', redirectTo: '' }
    ]
  },

  // ---------- Espace administrateur (back-office)
  {
    path: 'admin',
    canActivate: [roleGuard(Role.ADMIN)],
    loadComponent: () => import('./layouts/back-layout.component').then(m => m.BackLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./features/back/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'produits', loadComponent: () => import('./features/back/products.component').then(m => m.ProductsAdminComponent) },
      { path: 'categories', loadComponent: () => import('./features/back/categories.component').then(m => m.CategoriesAdminComponent) },
      { path: 'utilisateurs', loadComponent: () => import('./features/back/users.component').then(m => m.UsersAdminComponent) },
      { path: 'commandes', loadComponent: () => import('./features/back/orders.component').then(m => m.OrdersAdminComponent) },
      { path: 'livreurs', loadComponent: () => import('./features/back/carriers.component').then(m => m.CarriersAdminComponent) },
      { path: 'profil', loadComponent: () => import('./features/shared/profile.component').then(m => m.ProfileComponent) },
      { path: 'paiements', loadComponent: () => import('./features/back/paiement/payments.component').then(m => m.PaymentsAdminComponent) },   
      { path: '**', redirectTo: 'dashboard' },
 ]
  },

  { path: '**', redirectTo: 'auth/login' }
];
