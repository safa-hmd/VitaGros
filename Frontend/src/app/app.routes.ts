import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Auth routes (public)
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./components/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./components/auth/register/register.component').then(m => m.RegisterComponent)
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },

  // Protected routes (with layout shell)
  {
    path: '',
    loadComponent: () =>
      import('./components/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      // Dashboard
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },

      // Profile
      {
        path: 'profile',
        loadComponent: () =>
          import('./components/profile/profile.component').then(m => m.ProfileComponent)
      },

      // Products & Categories (port 8082)
      {
        path: 'products',
        loadComponent: () =>
          import('./components/products/products.component').then(m => m.ProductsComponent)
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./components/products/categories.component').then(m => m.CategoriesComponent)
      },

      // Orders & Order Lines (port 8083)
      {
        path: 'orders',
        loadComponent: () =>
          import('./components/orders/orders.component').then(m => m.OrdersComponent)
      },
      {
        path: 'order-lines',
        loadComponent: () =>
          import('./components/orders/order-lines.component').then(m => m.OrderLinesComponent)
      },

      // Payments & Invoices (port 8084)
      {
        path: 'invoices',
        loadComponent: () =>
          import('./components/payments/invoices.component').then(m => m.InvoicesComponent)
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./components/payments/payments.component').then(m => m.PaymentsComponent)
      },

      // Deliveries & Carriers (port 8085)
      {
        path: 'deliveries',
        loadComponent: () =>
          import('./components/deliveries/deliveries.component').then(m => m.DeliveriesComponent)
      },
      {
        path: 'carriers',
        loadComponent: () =>
          import('./components/deliveries/carriers.component').then(m => m.CarriersComponent)
      },

      // Users & Roles (port 8081)
      {
        path: 'users',
        loadComponent: () =>
          import('./components/users/users.component').then(m => m.UsersComponent)
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('./components/users/roles.component').then(m => m.RolesComponent)
      },

      // Default redirect to dashboard
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // Fallback
  { path: '**', redirectTo: 'auth/login' }
];
