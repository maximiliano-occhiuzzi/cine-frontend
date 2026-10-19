import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Protege pantallas que necesitan sesion iniciada pero no un rol puntual
// (a diferencia de adminGuard/gestionGuard): hoy /checkout y /historial.
// Antes estas rutas no tenian ningun guard -se podia entrar a /checkout
// por URL directa sin estar logueado, y recien se enteraba al fallar el
// POST /ventas (sin token -> 401 feo del backend). Con esto, ni siquiera
// se llega a pintar la pantalla: se manda derecho a /login con el
// returnUrl para volver exactamente a donde se queria ir.
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
