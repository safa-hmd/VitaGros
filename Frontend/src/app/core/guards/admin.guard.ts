import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    router.navigate(['/auth/admin-login']);
    return false;
  }

  if (auth.isAdmin()) {
    return true;
  }

  // Si connecté mais pas admin, rediriger vers la boutique client
  router.navigate(['/shop']);
  return false;
};
