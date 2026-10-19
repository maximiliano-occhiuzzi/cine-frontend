import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor funcional (estilo Angular 17 standalone):
 *  1. Le agrega "Authorization: Bearer <token>" a cada request saliente si
 *     hay sesion iniciada. El Gateway (UserHeadersFilter) es quien valida
 *     ese token y agrega X-User-Username/X-User-Roles antes de reenviar a
 *     cada microservicio.
 *  2. Si CUALQUIER request vuelve con 401 (token ausente, vencido o
 *     invalido -el Gateway lo devuelve asi, ver GatewaySecurityConfig),
 *     limpia la sesion local y manda a /login con el returnUrl puesto.
 *     Antes esto no existia: si el token expiraba a mitad de una compra,
 *     cada pantalla se las arreglaba sola (o ni eso) con un 401 suelto en
 *     vez de llevar al usuario a loguearse de nuevo.
 *
 * 403 (autenticado pero sin permiso, ej. CLIENTE pegandole a /ventas
 * completo) NO entra aca a proposito: ahi la sesion sigue siendo valida,
 * reloguearse no cambia nada -eso lo tiene que mostrar la pantalla misma.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(req).pipe(
    catchError((err) => {
      // /auth/login y /auth/refresh rechazados con 401 son credenciales
      // incorrectas o un refresh token vencido -eso lo maneja cada
      // pantalla con su propio mensaje (ver LoginComponent), no es "la
      // sesion se cayo a mitad de camino" y redirigir aca pisaria ese
      // mensaje con una redireccion fantasma.
      const esLoginOrefresh = req.url.includes('/auth/login') || req.url.includes('/auth/refresh');

      if (err?.status === 401 && !esLoginOrefresh) {
        const teniaSesion = authService.isLoggedIn();
        authService.logout();
        if (teniaSesion) {
          // Solo si de verdad habia una sesion que se cayo (token vencido
          // a mitad de uso): si ya estaba deslogueado, el 401 es el
          // comportamiento normal de un endpoint protegido y no hay nada
          // que "avisar" -evita un ciclo de redirects en pantallas
          // publicas que igual intentan pedir algo propio del usuario.
          router.navigate(['/login'], {
            queryParams: { returnUrl: router.url, sesionVencida: 'true' }
          });
        }
      }

      return throwError(() => err);
    })
  );
};
