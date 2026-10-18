import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Role } from '../../models/user.model';

/** Protège un espace : non connecté -> login de l'espace ; mauvais rôle -> son propre espace. */
export const roleGuard = (role: Role): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return router.parseUrl(role === Role.ADMIN ? '/auth/admin-login' : '/auth/login');
  }
  if (auth.currentUser()?.role === role) {
    return true;
  }
  return router.parseUrl(auth.homeUrl());
};

/** Pages de connexion / inscription : inutiles si déjà connecté. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn() ? router.parseUrl(auth.homeUrl()) : true;
};
