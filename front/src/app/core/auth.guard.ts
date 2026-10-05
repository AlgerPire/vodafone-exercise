import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.signedIn()) {
    const restored = await auth.restore();
    if (!restored) {
      return router.createUrlTree(['/login']);
    }
  }
  return true;
};

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.signedIn()) {
    await auth.restore();
  }
  if (auth.admin()) {
    return true;
  }
  return router.createUrlTree(['/account']);
};
