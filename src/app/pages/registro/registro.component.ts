import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registro.component.html',
  styleUrls: ['../login/login.component.css']
})
export class RegistroComponent {
  nombre = '';
  apellido = '';
  email = '';
  username = '';
  password = '';
  error = '';
  cargando = false;
  returnUrl = '/cartelera';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/cartelera';
  }

  registrarme(): void {
    this.error = '';
    if (!this.nombre || !this.apellido || !this.email || !this.username || !this.password) {
      this.error = 'Completá nombre, apellido, email, usuario y contraseña.';
      return;
    }
    this.cargando = true;
    this.authService.registrarCliente({
      nombre: this.nombre,
      apellido: this.apellido,
      email: this.email,
      username: this.username,
      password: this.password
    }).subscribe({
      next: () => {
        this.cargando = false;
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err) => {
        this.cargando = false;
        this.error = err.status === 409
          ? 'Ese usuario ya existe. Probá con otro.'
          : 'No se pudo completar el registro. Probá de nuevo en un momento.';
      }
    });
  }
}
