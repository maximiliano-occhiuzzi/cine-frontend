import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { VentasService } from '../../core/services/ventas.service';
import { extraerMensajeError } from '../../core/utils/error.util';
import { VentaDTO } from '../../core/models/venta.models';

@Component({
  selector: 'app-admin-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-ventas.component.html',
  styleUrls: ['./admin-ventas.component.css']
})
export class AdminVentasComponent implements OnInit {
  estados = ['PENDIENTE', 'PAGADA', 'CANCELADA'];

  ventas: VentaDTO[] = [];
  cargando = true;
  error = '';
  mensaje = '';

  // Filtros, todo client-side (mismo criterio que admin-usuarios): el back
  // ya trae TODAS las ventas de una (GET /ventas), filtrar acá evita pegarle
  // de nuevo al servidor por cada cambio de filtro.
  filtroUsuario = '';
  filtroEstado = '';

  // id de la venta cuya cancelación está en curso — deshabilita el botón
  // de esa fila puntual para no mandar el mismo cancelar() dos veces si
  // Ventas tarda en responder.
  cancelando: { [ventaId: number]: boolean } = {};

  constructor(private ventasService: VentasService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Si se llega desde "Ver compras" en Admin Usuarios, viene precargado
    // el username a filtrar.
    const usuario = this.route.snapshot.queryParamMap.get('usuario');
    if (usuario) {
      this.filtroUsuario = usuario;
    }
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.ventasService.listarTodas().subscribe({
      next: (data) => {
        // Más recientes primero: es lo que un admin/empleado busca al entrar.
        this.ventas = [...data].sort((a, b) => b.id - a.id);
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar las ventas.';
        this.cargando = false;
      }
    });
  }

  get ventasFiltradas(): VentaDTO[] {
    const texto = this.filtroUsuario.trim().toLowerCase();
    return this.ventas.filter(v => {
      const coincideUsuario = !texto || v.username.toLowerCase().includes(texto);
      const coincideEstado = !this.filtroEstado || v.estado === this.filtroEstado;
      return coincideUsuario && coincideEstado;
    });
  }

  listaButacas(venta: VentaDTO): string {
    return venta.butacas.map(b => `${b.fila}${b.numero}`).join(', ') || '—';
  }

  puedeCancelar(venta: VentaDTO): boolean {
    return venta.estado === 'PENDIENTE' || venta.estado === 'PAGADA';
  }

  cancelarVenta(venta: VentaDTO): void {
    const avisoReembolso = venta.estado === 'PAGADA'
      ? ' Ya está pagada: se va a intentar reembolsar el pago en Mercado Pago.'
      : '';
    if (!confirm(`¿Cancelar la compra N° V-${venta.id} de "${venta.username}"?${avisoReembolso}`)) return;

    this.cancelando[venta.id] = true;
    this.mensaje = '';
    this.ventasService.cancelar(venta.id).subscribe({
      next: (actualizada) => {
        this.cancelando[venta.id] = false;
        const idx = this.ventas.findIndex(v => v.id === actualizada.id);
        if (idx >= 0) this.ventas[idx] = actualizada;
        this.mensaje = `Compra N° V-${venta.id} cancelada.`;
      },
      error: (err) => {
        this.cancelando[venta.id] = false;
        this.mensaje = extraerMensajeError(err, 'No se pudo cancelar la compra.');
      }
    });
  }
}
