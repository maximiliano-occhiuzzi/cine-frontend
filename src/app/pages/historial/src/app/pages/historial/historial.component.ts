import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { VentasService } from '../../core/services/ventas.service';
import { ProductosService } from '../../core/services/productos.service';
import { VentaDTO } from '../../core/models/venta.models';

// Mercado Pago confirma el pago por un webhook APARTE que le pega a Ventas
// por su cuenta -no es parte de la vuelta del navegador (back_urls)- y ese
// webhook puede tardar unos segundos en llegar (más con ngrok de por
// medio). Sin este polling, alguien que vuelve de pagar y mira "Mis
// compras" al toque ve PENDIENTE de verdad (todavía no llegó el webhook) y
// se queda así hasta que recarga la pantalla a mano. Reconsultando solo
// unas pocas veces mientras haya compras pendientes con link ya generado,
// la pantalla se pone al día sola apenas el webhook procesa.
const POLL_INTERVALO_MS = 3000;
const POLL_INTENTOS_MAXIMOS = 20; // ~60s: tiempo de sobra para un webhook normal, sin quedar sondeando para siempre si la compra quedo pendiente de verdad.

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

  // Viene del back_urls que arma Ventas al crear la preferencia de MP: el
  // navegador del comprador vuelve solo (auto_return) a esta pantalla con
  // ?pago=exitoso|fallido|pendiente en la URL.
  avisoPago: 'exitoso' | 'fallido' | 'pendiente' | null = null;

  // VentaProductoDTO solo trae el productoId, no el nombre -> para mostrar
  // "Pochoclo grande x2" en vez de "Producto #4 x2" resolvemos los nombres
  // una sola vez contra el catalogo de confiteria.
  private nombresProductos: { [id: number]: string } = {};

  // Antes, si Mercado Pago no generaba un link de pago real al comprar
  // (ver sinLinkDePago), la venta quedaba PENDIENTE para siempre en esta
  // pantalla: no habia forma de pagarla ni de volver a intentarlo, solo el
  // mensaje de advertencia. reintentando/errorReintento son por venta, para
  // poder tener varias tarjetas "PENDIENTE" en pantalla a la vez.
  reintentando: { [ventaId: number]: boolean } = {};
  errorReintento: { [ventaId: number]: string } = {};

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
      // Saca el ?pago=... de la URL sin recargar, asi si el usuario refresca
      // la pantalla no le vuelve a mostrar el mismo aviso.
      this.router.navigate([], { relativeTo: this.route, queryParams: {} });
    }

    this.productosService.obtenerConfiteria().subscribe({
      next: (productos) => {
        productos.forEach(p => this.nombresProductos[p.id] = p.nombre);
      },
      error: () => {} // si falla, mostramos "Producto #id" como respaldo
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

  // Una compra "en vuelo" es PENDIENTE pero ya tiene un link de pago real
  // (tienePreferenciaDePago): o el comprador todavia no termino de pagar, o
  // ya pago y estamos esperando el webhook de Mercado Pago. En cualquiera
  // de los dos casos, vale la pena reconsultar sola en vez de dejar que el
  // usuario se quede mirando un estado que puede estar por cambiar.
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

  // Compra PENDIENTE con link de pago ya generado: todavia no se sabe si
  // el comprador la pago o no (ver nota de polling arriba) -distinto de
  // sinLinkDePago(), donde Mercado Pago nunca llego a responder.
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

  // Antes esto exigia ademas "!venta.tienePreferenciaDePago", pensando que
  // el boton solo hacia falta si Mercado Pago NUNCA habia generado un link.
  // Pero el caso mas comun de "compra PENDIENTE" es justo el otro: el
  // usuario SI llego a tener un link (tienePreferenciaDePago = true) y no
  // pago (cerro la pestana, se le corto internet, se arrepintio un rato).
  // Ese link viejo no se puede recuperar aca: initPoint SOLO viaja completo
  // en la respuesta de comprar/reintentar-pago, en este listado
  // (GET /ventas/mias) siempre es null -asi que sin el boton esa compra
  // quedaba "esperando confirmacion" para siempre, sin ninguna accion
  // posible desde el dashboard. Ahora se ofrece reintentar para CUALQUIER
  // venta PENDIENTE, haya o no un link previo: reintentarPago() siempre
  // pide una preferencia nueva, sin importar si ya existia una vieja.
  sinLinkDePago(venta: VentaDTO): boolean {
    return venta.estado === 'PENDIENTE';
  }

  reintentarPago(venta: VentaDTO): void {
    this.reintentando[venta.id] = true;
    this.errorReintento[venta.id] = '';

    this.ventasService.reintentarPago(venta.id).subscribe({
      next: (actualizada) => {
        this.reintentando[venta.id] = false;
        if (actualizada.initPoint) {
          // Mismo flujo que al comprar: se manda al comprador a pagar.
          window.location.href = actualizada.initPoint;
        } else {
          // Mercado Pago volvio a fallar; se lo decimos en vez de dejar
          // el boton sin reaccionar.
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
