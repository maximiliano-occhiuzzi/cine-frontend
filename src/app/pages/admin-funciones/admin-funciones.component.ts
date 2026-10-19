import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalasService } from '../../core/services/salas.service';
import { ProductosService } from '../../core/services/productos.service';
import { extraerMensajeError } from '../../core/utils/error.util';
import {
  FuncionResponseDTO,
  FuncionAltaFormDTO,
  FuncionEditarFormDTO,
  Sala,
  Pelicula
} from '../../core/models/cine.models';

const FORM_VACIO: FuncionAltaFormDTO = {
  salaId: 0,
  peliculaId: 0,
  fechaHora: '',
  precioBase: 0
};

@Component({
  selector: 'app-admin-funciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-funciones.component.html',
  styleUrls: ['./admin-funciones.component.css']
})
export class AdminFuncionesComponent implements OnInit {
  funciones: FuncionResponseDTO[] = [];
  salas: Sala[] = [];
  peliculas: Pelicula[] = [];
  cargando = true;
  error = '';
  mensaje = '';

  mostrarForm = false;
  editandoId: number | null = null;
  form: FuncionAltaFormDTO = { ...FORM_VACIO };

  constructor(
    private salasService: SalasService,
    private productosService: ProductosService
  ) {}

  ngOnInit(): void {
    this.salasService.obtenerSalas().subscribe(data => this.salas = data);
    this.productosService.obtenerTodasLasPeliculas().subscribe(data => this.peliculas = data);
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.salasService.obtenerTodasLasFunciones().subscribe({
      next: (data) => {
        this.funciones = data;
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar las funciones.';
        this.cargando = false;
      }
    });
  }

  tituloPelicula(peliculaId: number): string {
    return this.peliculas.find(p => p.id === peliculaId)?.titulo || `Película #${peliculaId}`;
  }

  nuevaFuncion(): void {
    this.editandoId = null;
    this.form = { ...FORM_VACIO };
    this.mostrarForm = true;
    this.mensaje = '';
  }

  editar(f: FuncionResponseDTO): void {
    this.editandoId = f.id;
    this.form = {
      salaId: f.salaId,
      peliculaId: f.peliculaId,
      fechaHora: f.fechaHora.substring(0, 16),
      precioBase: f.precioBase
    };
    this.mostrarForm = true;
    this.mensaje = '';
  }

  cancelar(): void {
    this.mostrarForm = false;
    this.editandoId = null;
  }

  // Valida en el front ANTES de pegarle al backend, asi un campo vacio no
  // termina en un 400 confuso (ej: la fecha vacia no se puede convertir a
  // LocalDateTime del lado del servidor).
  private validar(): string | null {
    if (!this.form.peliculaId) return 'Elegí una película.';
    if (!this.editandoId && !this.form.salaId) return 'Elegí una sala.';
    if (!this.form.fechaHora) return 'Completá la fecha y hora de la función.';
    if (!this.form.precioBase || this.form.precioBase <= 0) return 'El precio tiene que ser mayor a 0.';
    return null;
  }

  guardar(): void {
    this.mensaje = '';
    const errorValidacion = this.validar();
    if (errorValidacion) {
      this.mensaje = errorValidacion;
      return;
    }

    if (this.editandoId) {
      const dto: FuncionEditarFormDTO = {
        peliculaId: this.form.peliculaId,
        fechaHora: this.form.fechaHora,
        precioBase: this.form.precioBase
      };
      this.salasService.editarFuncion(this.editandoId, dto).subscribe({
        next: () => this.alGuardar('Función actualizada.'),
        error: (err) => this.mensaje = extraerMensajeError(err, 'No se pudo guardar la función.')
      });
    } else {
      this.salasService.crearFuncion(this.form).subscribe({
        next: () => this.alGuardar('Función creada.'),
        error: (err) => this.mensaje = extraerMensajeError(err, 'No se pudo guardar la función.')
      });
    }
  }

  private alGuardar(texto: string): void {
    this.mensaje = texto;
    this.mostrarForm = false;
    this.editandoId = null;
    this.cargar();
  }

  eliminar(f: FuncionResponseDTO): void {
    if (!confirm(`¿Eliminar la función de "${this.tituloPelicula(f.peliculaId)}"?`)) return;
    this.salasService.eliminarFuncion(f.id).subscribe({
      next: () => this.cargar(),
      error: (err) => this.mensaje = extraerMensajeError(err, 'No se pudo eliminar la función.')
    });
  }
}
