import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { extraerMensajeError } from '../../core/utils/error.util';
import { AdminUsuarioDTO, EditarUsuarioRequest, NuevoUsuarioRequest } from '../../core/models/auth.models';

const FORM_VACIO: NuevoUsuarioRequest = {
  username: '',
  password: '',
  nombre: '',
  apellido: '',
  email: '',
  rol: 'CLIENTE'
};

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-usuarios.component.html',
  styleUrls: ['./admin-usuarios.component.css']
})
export class AdminUsuariosComponent implements OnInit {
  roles: Array<'ADMIN' | 'EMPLEADO' | 'CLIENTE'> = ['ADMIN', 'EMPLEADO', 'CLIENTE'];

  usuarios: AdminUsuarioDTO[] = [];
  cargando = true;
  error = '';
  mensaje = '';

  // Filtros (todo client-side: la lista completa de usuarios no suele ser
  // tan grande como para justificar paginado/filtrado en el backend).
  textoFiltro = '';
  rolFiltro: '' | 'ADMIN' | 'EMPLEADO' | 'CLIENTE' = '';

  mostrarForm = false;
  editandoUsername: string | null = null;
  form: NuevoUsuarioRequest = { ...FORM_VACIO };

  constructor(public authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.authService.listarUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudo cargar la lista de usuarios.';
        this.cargando = false;
      }
    });
  }

  get usuariosFiltrados(): AdminUsuarioDTO[] {
    const texto = this.textoFiltro.trim().toLowerCase();
    return this.usuarios.filter(u => {
      const coincideTexto = !texto
        || u.username.toLowerCase().includes(texto)
        || `${u.nombre} ${u.apellido}`.toLowerCase().includes(texto)
        || u.email.toLowerCase().includes(texto);
      const coincideRol = !this.rolFiltro || u.rol === this.rolFiltro;
      return coincideTexto && coincideRol;
    });
  }

  nuevoUsuario(): void {
    this.editandoUsername = null;
    this.form = { ...FORM_VACIO };
    this.mostrarForm = true;
    this.mensaje = '';
  }

  editar(u: AdminUsuarioDTO): void {
    this.editandoUsername = u.username;
    // El username y la contraseña no se editan acá (ver ActualizarUsuarioRequest
    // en el back): password queda vacío solo para completar el tipo del form,
    // nunca se manda en la edición.
    this.form = { username: u.username, password: '', nombre: u.nombre, apellido: u.apellido, email: u.email, rol: u.rol };
    this.mostrarForm = true;
    this.mensaje = '';
  }

  cancelar(): void {
    this.mostrarForm = false;
    this.editandoUsername = null;
  }

  guardar(): void {
    this.mensaje = '';

    if (this.editandoUsername) {
      const dto: EditarUsuarioRequest = {
        nombre: this.form.nombre,
        apellido: this.form.apellido,
        email: this.form.email,
        rol: this.form.rol
      };
      this.authService.editarUsuario(this.editandoUsername, dto).subscribe({
        next: () => {
          this.mensaje = 'Usuario actualizado.';
          this.mostrarForm = false;
          this.editandoUsername = null;
          this.cargar();
        },
        error: (err) => this.mensaje = extraerMensajeError(err, 'No se pudo actualizar el usuario.')
      });
      return;
    }

    this.authService.crearUsuario(this.form).subscribe({
      next: () => {
        this.mensaje = 'Usuario creado.';
        this.mostrarForm = false;
        this.cargar();
      },
      error: (err) => this.mensaje = extraerMensajeError(err, 'No se pudo crear el usuario. ¿El username ya existe?')
    });
  }

  // Baja/alta LÓGICA (ver nota en Usuario.habilitado del back): nunca se
  // borra un usuario, solo se le corta/devuelve el acceso — sus compras
  // y facturas viejas quedan intactas.
  darDeBaja(u: AdminUsuarioDTO): void {
    if (!confirm(`¿Deshabilitar a "${u.username}"? No va a poder iniciar sesión hasta que lo reactives.`)) return;
    this.authService.cambiarEstadoUsuario(u.username, false).subscribe({
      next: () => this.cargar(),
      error: (err) => this.mensaje = extraerMensajeError(err, 'No se pudo deshabilitar el usuario.')
    });
  }

  reactivar(u: AdminUsuarioDTO): void {
    this.authService.cambiarEstadoUsuario(u.username, true).subscribe({
      next: () => this.cargar(),
      error: (err) => this.mensaje = extraerMensajeError(err, 'No se pudo reactivar el usuario.')
    });
  }

  verCompras(u: AdminUsuarioDTO): void {
    this.router.navigate(['/admin/ventas'], { queryParams: { usuario: u.username } });
  }
}
