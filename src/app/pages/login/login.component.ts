import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  cargando = false;
  returnUrl = '/cartelera';

  // Breve pantalla de transicion ("Entrando al cine...") entre que el
  // login responde bien y se navega a returnUrl -antes se pasaba del
  // formulario a la pantalla siguiente en el mismo instante, de un salto
  // seco. No es una carga real (el login ya terminó), es puramente para
  // que la entrada se sienta menos brusca.
  entrando = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/cartelera';

    // Lo pone authInterceptor cuando un 401 a mitad de sesion te manda de
    // vuelta para acá (token vencido mientras se usaba la app) -distinto
    // de nunca haber iniciado sesion, vale la pena decirlo en vez de
    // mostrar el formulario pelado sin explicar por que apareciste acá.
    if (this.route.snapshot.queryParamMap.get('sesionVencida') === 'true') {
      this.error = 'Tu sesión expiró. Iniciá sesión de nuevo para continuar.';
    }
  }

  ingresar(): void {
    this.error = '';
    this.cargando = true;
    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: () => {
        this.cargando = false;
        this.entrando = true;
        setTimeout(() => this.router.navigateByUrl(this.returnUrl), 600);
      },
      error: (err) => {
        this.cargando = false;
        this.error = err.status === 401
          ? 'Usuario o contraseña incorrectos.'
          : 'No se pudo iniciar sesión. Probá de nuevo en un momento.';
      }
    });
  }
}
