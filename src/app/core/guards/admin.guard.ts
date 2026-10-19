import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Protege las rutas /admin/**: solo usuarios logueados con rol ADMIN.
// El backend es la autoridad real (el Gateway exige hasRole("ADMIN") para
// escritura en /productos/**), este guard solo evita que un cliente/empleado
// vea la pantalla y reciba un 403 al primer click.
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn() && authService.isAdmin()) {
    return true;
  }

  router.navigate(['/cartelera']);
  return false;
};
