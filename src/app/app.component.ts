import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Router,
  RouterOutlet,
  RouterLink,
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError
} from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Cine-Frontend';

  // Barrita de progreso arriba de todo durante la navegacion entre
  // pantallas (y mientras un guard como authGuard/adminGuard decide si
  // deja pasar o redirige). Antes el cambio de pantalla era instantaneo y
  // seco -esto le da un segundo de transicion visual, sobre todo notorio
  // cuando una pantalla carga datos de varios microservicios antes de
  // pintar (ej. cartelera, mapa de asientos).
  navegando = false;

  // Antes eran hasta 6 links sueltos en el navbar (Peliculas, Confiteria,
  // Salas, Funciones, Usuarios, Ventas) -se agrupan en un solo "Admin ▾".
  menuAdminAbierto = false;

  constructor(public authService: AuthService, private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.navegando = true;
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.navegando = false;
        this.menuAdminAbierto = false;
      }
    });
  }

  toggleMenuAdmin(event: Event): void {
    event.stopPropagation();
    this.menuAdminAbierto = !this.menuAdminAbierto;
  }

  // Cierra el dropdown al clickear en cualquier otro lado de la pantalla.
  // toggleMenuAdmin ya corta la propagacion del click que lo abre, asi que
  // ese mismo click no llega hasta aca y no se abre-y-cierra en el mismo tap.
  @HostListener('document:click')
  cerrarMenuAdmin(): void {
    this.menuAdminAbierto = false;
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/cartelera']);
  }
}
