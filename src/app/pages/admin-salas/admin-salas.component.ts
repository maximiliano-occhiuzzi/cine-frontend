import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalasService } from '../../core/services/salas.service';
import { extraerMensajeError } from '../../core/utils/error.util';
import { Sala, SalaAltaFormDTO, SalaEditarFormDTO, TipoSala } from '../../core/models/cine.models';

const FORM_VACIO: SalaAltaFormDTO = {
  nombre: '',
  tipo: TipoSala.SALA_2D,
  filas: 8,
  asientosPorFila: 10
};

@Component({
  selector: 'app-admin-salas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-salas.component.html',
  styleUrls: ['./admin-salas.component.css']
})
export class AdminSalasComponent implements OnInit {
  tipos = Object.values(TipoSala);
  salas: Sala[] = [];
  cargando = true;
  error = '';
  mensaje = '';

  mostrarForm = false;
  editandoId: number | null = null;
  form: SalaAltaFormDTO = { ...FORM_VACIO };

  constructor(private salasService: SalasService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.salasService.obtenerSalas().subscribe({
      next: (data) => {
        this.salas = data;
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar las salas.';
        this.cargando = false;
      }
    });
  }

  nuevaSala(): void {
    this.editandoId = null;
    this.form = { ...FORM_VACIO };
    this.mostrarForm = true;
    this.mensaje = '';
  }

  editar(s: Sala): void {
    this.editandoId = s.id;
    this.form = { nombre: s.nombre, tipo: s.tipo, filas: 0, asientosPorFila: 0 };
    this.mostrarForm = true;
    this.mensaje = '';
  }

  cancelar(): void {
    this.mostrarForm = false;
    this.editandoId = null;
  }

  guardar(): void {
    this.mensaje = '';

    if (this.editandoId) {
      const dto: SalaEditarFormDTO = { nombre: this.form.nombre, tipo: this.form.tipo };
      this.salasService.editarSala(this.editandoId, dto).subscribe({
        next: () => this.alGuardar('Sala actualizada.'),
        error: (err) => this.mensaje = extraerMensajeError(err, 'No se pudo guardar la sala.')
      });
    } else {
      this.salasService.crearSala(this.form).subscribe({
        next: () => this.alGuardar('Sala creada (con su mapa de butacas).'),
        error: (err) => this.mensaje = extraerMensajeError(err, 'No se pudo guardar la sala.')
      });
    }
  }

  private alGuardar(texto: string): void {
    this.mensaje = texto;
    this.mostrarForm = false;
    this.editandoId = null;
    this.cargar();
  }

  eliminar(s: Sala): void {
    if (!confirm(`¿Eliminar "${s.nombre}"? Esto borra también su mapa de butacas.`)) return;
    this.salasService.eliminarSala(s.id).subscribe({
      next: () => this.cargar(),
      error: (err) => this.mensaje = extraerMensajeError(err, 'No se pudo eliminar la sala (¿tiene funciones programadas?).')
    });
  }
}
