import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Protege /admin/ventas: a diferencia de adminGuard (solo ADMIN, usado en
// peliculas/confiteria/salas/funciones), el panel de ventas lo pueden ver
// tanto ADMIN como EMPLEADO — asi lo deja el Gateway para /ventas/**
// (hasAnyRole("ADMIN","EMPLEADO")), asi que el guard tiene que calzar con
// eso o un EMPLEADO legitimo rebotaria antes de llegar a pedir nada.
export const gestionGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn() && authService.puedeGestionarVentas()) {
    return true;
  }

  router.navigate(['/cartelera']);
  return false;
};
