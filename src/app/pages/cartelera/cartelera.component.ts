import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductosService } from '../../core/services/productos.service';
import { SalasService } from '../../core/services/salas.service';
import { Pelicula, FuncionResponseDTO } from '../../core/models/cine.models';

export interface GrupoDeFunciones {
  etiqueta: string;
  funciones: FuncionResponseDTO[];
}

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

@Component({
  selector: 'app-cartelera',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cartelera.component.html',
  styleUrls: ['./cartelera.component.css']
})
export class CarteleraComponent implements OnInit {
  peliculas: Pelicula[] = [];
  peliculaSeleccionada: Pelicula | null = null;
  funciones: FuncionResponseDTO[] = [];

  // En vez de botones HOY/MAÑANA/FINDE que hay que entender, mostramos
  // directamente TODAS las funciones futuras de la película elegida,
  // ordenadas por fecha y agrupadas bajo un título legible (Hoy, Mañana,
  // Sábado 24/10, etc.) — no hay nada que el usuario tenga que filtrar.
  gruposDeFunciones: GrupoDeFunciones[] = [];

  constructor(
    private productosService: ProductosService,
    private salasService: SalasService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarPeliculas();
    this.cargarFunciones();
  }

  cargarPeliculas(): void {
    this.productosService.obtenerPeliculas().subscribe(data => {
      this.peliculas = data;
      if (data.length > 0) {
        this.peliculaSeleccionada = data[0];
        this.agruparFunciones();
      }
    });
  }

  cargarFunciones(): void {
    this.salasService.obtenerCartelera().subscribe(data => {
      this.funciones = data;
      this.agruparFunciones();
    });
  }

  seleccionarPelicula(pelicula: Pelicula): void {
    this.peliculaSeleccionada = pelicula;
    this.agruparFunciones();
  }

  agruparFunciones(): void {
    if (!this.peliculaSeleccionada) return;

    const ahora = new Date();
    const futuras = this.funciones
      .filter(f => f.peliculaId === this.peliculaSeleccionada?.id)
      .filter(f => new Date(f.fechaHora).getTime() >= ahora.getTime())
      .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());

    const grupos: GrupoDeFunciones[] = [];
    for (const f of futuras) {
      const etiqueta = this.etiquetaDeDia(new Date(f.fechaHora), ahora);
      let grupo = grupos.find(g => g.etiqueta === etiqueta);
      if (!grupo) {
        grupo = { etiqueta, funciones: [] };
        grupos.push(grupo);
      }
      grupo.funciones.push(f);
    }
    this.gruposDeFunciones = grupos;
  }

  // "Hoy", "Mañana" o "Día dd/mm" — siempre calculado contra la fecha real,
  // nunca contra un botón que haya que entender.
  private etiquetaDeDia(fecha: Date, ahora: Date): string {
    if (this.esMismoDiaCalendario(fecha, ahora)) return 'Hoy';

    const manana = new Date(ahora);
    manana.setDate(ahora.getDate() + 1);
    if (this.esMismoDiaCalendario(fecha, manana)) return 'Mañana';

    const nombreDia = DIAS_SEMANA[fecha.getDay()];
    const dd = String(fecha.getDate()).padStart(2, '0');
    const mm = String(fecha.getMonth() + 1).padStart(2, '0');
    return `${nombreDia} ${dd}/${mm}`;
  }

  private esMismoDiaCalendario(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }

  irAMapa(funcion: FuncionResponseDTO): void {
    this.router.navigate(['/mapa-asientos', funcion.salaId], {
      queryParams: {
        precio: funcion.precioBase,
        funcionId: funcion.id,
        pelicula: this.peliculaSeleccionada?.titulo
      }
    });
  }
}
