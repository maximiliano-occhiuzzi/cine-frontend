import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { VentasService } from '../../core/services/ventas.service';
import { ProductosService } from '../../core/services/productos.service';
import { VentaDTO } from '../../core/models/venta.models';

const POLL_INTERVALO_MS = 3000;
const POLL_INTENTOS_MAXIMOS = 20;

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './historial.component.html',
  styleUrls: ['./historial.component.css']
})
export class HistorialComponent implements OnInit, OnDestroy {
  compras: VentaDTO[] = [];
  cargando = true;
  error = '';
  avisoPago: 'exitoso' | 'fallido' | 'pendiente' | null = null;
  private nombresProductos: { [id: number]: string } = {};

  reintentando: { [ventaId: number]: boolean } = {};
  errorReintento: { [ventaId: number]: string } = {};

  cancelando: { [ventaId: number]: boolean } = {};
  errorCancelar: { [ventaId: number]: string } = {};

  private pollHandle: ReturnType<typeof setInterval> | null = null;
  private intentosPoll = 0;

  constructor(
    private ventasService: VentasService,
    private productosService: ProductosService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const pago = this.route.snapshot.queryParamMap.get('pago');
    if (pago === 'exitoso' || pago === 'fallido' || pago === 'pendiente') {
      this.avisoPago = pago;
      this.router.navigate([], { relativeTo: this.route, queryParams: {} });
    }

    this.productosService.obtenerConfiteria().subscribe({
      next: (productos) => {
        productos.forEach(p => this.nombresProductos[p.id] = p.nombre);
      },
      error: () => {}
    });

    this.cargarCompras();
  }

  ngOnDestroy(): void {
    this.detenerPolling();
  }

  private cargarCompras(): void {
    this.ventasService.misCompras().subscribe({
      next: (data) => {
        this.compras = data;
        this.cargando = false;
        this.evaluarPolling();
      },
      error: () => {
        this.error = 'No se pudieron cargar tus compras.';
        this.cargando = false;
      }
    });
  }

  private hayCompraEnVuelo(): boolean {
    return this.compras.some(v => v.estado === 'PENDIENTE' && v.tienePreferenciaDePago);
  }

  private evaluarPolling(): void {
    if (this.hayCompraEnVuelo() && this.intentosPoll < POLL_INTENTOS_MAXIMOS) {
      if (!this.pollHandle) {
        this.pollHandle = setInterval(() => {
          this.intentosPoll++;
          if (this.intentosPoll >= POLL_INTENTOS_MAXIMOS) {
            this.detenerPolling();
            return;
          }
          this.cargarCompras();
        }, POLL_INTERVALO_MS);
      }
    } else {
      this.detenerPolling();
    }
  }

  private detenerPolling(): void {
    if (this.pollHandle) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
    }
  }

  esperandoConfirmacion(venta: VentaDTO): boolean {
    return venta.estado === 'PENDIENTE' && venta.tienePreferenciaDePago;
  }

  listaButacas(venta: VentaDTO): string {
    return venta.butacas.map(b => `${b.fila}${b.numero}`).join(', ');
  }

  nombreProducto(productoId: number): string {
    return this.nombresProductos[productoId] || `Producto #${productoId}`;
  }

  totalConfiteria(venta: VentaDTO): number {
    return (venta.productos || []).reduce((acc, p) => acc + p.subtotal, 0);
  }

  totalEntradas(venta: VentaDTO): number {
    return venta.total - this.totalConfiteria(venta);
  }

  sinLinkDePago(venta: VentaDTO): boolean {
    return venta.estado === 'PENDIENTE';
  }

  puedeCancelar(venta: VentaDTO): boolean {
    return venta.estado !== 'CANCELADA';
  }

  cancelarVenta(venta: VentaDTO): void {
    const confirmado = window.confirm(
      venta.estado === 'PAGADA'
        ? `¿Cancelar la compra V-${venta.id}? Si corresponde, se va a iniciar el reembolso en Mercado Pago y se liberan las butacas.`
        : `¿Cancelar la compra V-${venta.id}? Se liberan las butacas reservadas.`
    );
    if (!confirmado) return;

    this.cancelando[venta.id] = true;
    this.errorCancelar[venta.id] = '';

    this.ventasService.cancelar(venta.id).subscribe({
      next: (actualizada) => {
        this.cancelando[venta.id] = false;
        const idx = this.compras.findIndex(v => v.id === actualizada.id);
        if (idx !== -1) this.compras[idx] = actualizada;
      },
      error: (err) => {
        this.cancelando[venta.id] = false;
        this.errorCancelar[venta.id] = err?.error?.message || 'No se pudo cancelar la compra.';
      }
    });
  }

  reintentarPago(venta: VentaDTO): void {
    this.reintentando[venta.id] = true;
    this.errorReintento[venta.id] = '';

    this.ventasService.reintentarPago(venta.id).subscribe({
      next: (actualizada) => {
        this.reintentando[venta.id] = false;
        if (actualizada.initPoint) {
          window.location.href = actualizada.initPoint;
        } else {
          this.errorReintento[venta.id] = 'Mercado Pago no respondió de nuevo. Probá otra vez en un momento.';
        }
      },
      error: (err) => {
        this.reintentando[venta.id] = false;
        this.errorReintento[venta.id] = err?.error?.message || 'No se pudo generar un nuevo link de pago.';
      }
    });
  }
}
