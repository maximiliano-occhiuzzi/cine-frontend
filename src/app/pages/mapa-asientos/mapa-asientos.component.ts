import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SalasService } from '../../core/services/salas.service';
import { AuthService } from '../../core/services/auth.service';
import { CarritoService } from '../../core/services/carrito.service';
import { ButacaDTO, EstadoButaca } from '../../core/models/cine.models';

@Component({
  selector: 'app-mapa-asientos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mapa-asientos.component.html',
  styleUrls: ['./mapa-asientos.component.css']
})
export class MapaAsientosComponent implements OnInit {
  salaId: number = 1;
  funcionId: number | null = null;
  precioBase: number = 8500;
  tituloPelicula: string = 'RESIDENT EVIL: NOCHE CERO';

  butacas: ButacaDTO[] = [];
  filasUnicas: string[] = [];
  asientosPorFilaMap: { [key: string]: ButacaDTO[] } = {};
  butacasSeleccionadas: ButacaDTO[] = [];
  mostrarModalAuth: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private salasService: SalasService,
    private authService: AuthService,
    private carritoService: CarritoService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('salaId');
    if (idParam) {
      this.salaId = Number(idParam);
    }
    const funcionIdParam = this.route.snapshot.queryParamMap.get('funcionId');
    this.funcionId = funcionIdParam ? Number(funcionIdParam) : null;
    this.precioBase = Number(this.route.snapshot.queryParamMap.get('precio')) || 8500;
    this.tituloPelicula = this.route.snapshot.queryParamMap.get('pelicula') || 'RESIDENT EVIL: NOCHE CERO';

    this.cargarMapa();
  }

  cargarMapa(): void {
    this.salasService.obtenerButacasPorSala(this.salaId).subscribe({
      next: (data) => {
        this.butacas = data;
        this.organizarGrilla();
      },
      error: () => {
        this.organizarGrilla();
      }
    });
  }

  organizarGrilla(): void {
    this.asientosPorFilaMap = {};
    const filasSet = new Set<string>();

    this.butacas.forEach(b => {
      filasSet.add(b.fila);
      if (!this.asientosPorFilaMap[b.fila]) {
        this.asientosPorFilaMap[b.fila] = [];
      }
      this.asientosPorFilaMap[b.fila].push(b);
    });

    this.filasUnicas = Array.from(filasSet).sort();
    Object.keys(this.asientosPorFilaMap).forEach(fila => {
      this.asientosPorFilaMap[fila].sort((a, b) => a.numero - b.numero);
    });
  }

  toggleAsiento(butaca: ButacaDTO): void {
    if (butaca.estado === EstadoButaca.OCUPADO) return;

    butaca.seleccionada = !butaca.seleccionada;
    if (butaca.seleccionada) {
      this.butacasSeleccionadas.push(butaca);
    } else {
      this.butacasSeleccionadas = this.butacasSeleccionadas.filter(b => b.id !== butaca.id);
    }
  }

  get listaAsientosTexto(): string {
    return this.butacasSeleccionadas.map(b => `${b.fila}-${b.numero}`).join(', ');
  }

  get totalPagar(): number {
    return this.butacasSeleccionadas.length * this.precioBase;
  }

  continuarCompra(): void {
    if (this.butacasSeleccionadas.length === 0) return;

    if (this.funcionId) {
      this.carritoService.setFuncion({
        funcionId: this.funcionId,
        salaId: this.salaId,
        precioBase: this.precioBase,
        peliculaTitulo: this.tituloPelicula
      });
    }
    this.carritoService.setButacas(this.butacasSeleccionadas);

    if (!this.authService.isLoggedIn()) {
      this.mostrarModalAuth = true;
    } else {
      // Despues de elegir butacas, el siguiente paso del flujo es la
      // confiteria (opcional) y recien despues el checkout final.
      this.router.navigate(['/candy']);
    }
  }
}