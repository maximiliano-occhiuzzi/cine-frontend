import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductosService } from '../../core/services/productos.service';
import { extraerMensajeError } from '../../core/utils/error.util';
import { Pelicula, PeliculaFormDTO } from '../../core/models/cine.models';

const FORM_VACIO: PeliculaFormDTO = {
  titulo: '',
  genero: '',
  duracion: 100,
  director: '',
  guionista: '',
  fechaEstreno: '',
  sinopsis: '',
  clasificacionEdad: 'ATP',
  calificacion: 4,
  poster: '',
  reparto: '',
  formatoDisponible: '2D'
};

@Component({
  selector: 'app-admin-peliculas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-peliculas.component.html',
  styleUrls: ['./admin-peliculas.component.css']
})
export class AdminPeliculasComponent implements OnInit {
  peliculas: Pelicula[] = [];
  cargando = true;
  error = '';
  mensaje = '';

  mostrarForm = false;
  editandoId: number | null = null;
  form: PeliculaFormDTO = { ...FORM_VACIO };

  constructor(private productosService: ProductosService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.productosService.obtenerTodasLasPeliculas().subscribe({
      next: (data) => {
        this.peliculas = data;
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudo cargar la cartelera.';
        this.cargando = false;
      }
    });
  }

  nuevaPelicula(): void {
    this.editandoId = null;
    this.form = { ...FORM_VACIO };
    this.mostrarForm = true;
    this.mensaje = '';
  }

  editar(p: Pelicula): void {
    this.editandoId = p.id;
    this.form = {
      titulo: p.titulo,
      genero: p.genero,
      duracion: p.duracion,
      director: p.director,
      guionista: p.guionista || '',
      fechaEstreno: p.fechaEstreno || '',
      sinopsis: p.sinopsis,
      clasificacionEdad: p.clasificacionEdad,
      calificacion: p.calificacion,
      poster: p.poster,
      reparto: p.reparto || '',
      formatoDisponible: p.formatoDisponible || ''
    };
    this.mostrarForm = true;
    this.mensaje = '';
  }

  cancelar(): void {
    this.mostrarForm = false;
    this.editandoId = null;
  }

  guardar(): void {
    this.mensaje = '';
    const obs = this.editandoId
      ? this.productosService.editarPelicula(this.editandoId, this.form)
      : this.productosService.crearPelicula(this.form);

    obs.subscribe({
      next: () => {
        this.mensaje = this.editandoId ? 'Película actualizada.' : 'Película creada.';
        this.mostrarForm = false;
        this.editandoId = null;
        this.cargar();
      },
      error: (err) => {
        this.mensaje = extraerMensajeError(err, 'No se pudo guardar la película.');
      }
    });
  }

  darDeBaja(p: Pelicula): void {
    if (!confirm(`¿Dar de baja "${p.titulo}" de la cartelera?`)) return;
    this.productosService.eliminarPelicula(p.id).subscribe({
      next: () => this.cargar(),
      error: () => this.mensaje = 'No se pudo dar de baja la película.'
    });
  }
}
