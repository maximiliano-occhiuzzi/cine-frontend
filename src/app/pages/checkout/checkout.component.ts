import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CarritoService } from '../../core/services/carrito.service';
import { AuthService } from '../../core/services/auth.service';
import { VentasService } from '../../core/services/ventas.service';
import { VentaAltaDTO, VentaDTO } from '../../core/models/venta.models';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent {
  cargando = false;
  error = '';
  venta: VentaDTO | null = null;

  constructor(
    public carritoService: CarritoService,
    public authService: AuthService,
    private ventasService: VentasService,
    private router: Router
  ) {}

  get listaAsientosTexto(): string {
    return this.carritoService.butacas.map(b => `${b.fila}${b.numero}`).join(', ');
  }

  confirmarCompra(): void {
    const funcion = this.carritoService.funcion;
    if (!funcion || this.carritoService.butacas.length === 0) {
      this.error = 'No hay butacas seleccionadas. Volvé a elegir tus asientos.';
      return;
    }

    const dto: VentaAltaDTO = {
      funcionId: funcion.funcionId,
      butacaIds: this.carritoService.butacas.map(b => b.id),
      productos: this.carritoService.candy.map(c => ({ productoId: c.productoId, cantidad: c.cantidad })),
      peliculaTitulo: funcion.peliculaTitulo
    };

    this.cargando = true;
    this.error = '';
    this.ventasService.comprar(dto).subscribe({
      next: (venta) => {
        this.cargando = false;
        this.venta = venta;
        this.carritoService.limpiar();
        // Si Mercado Pago esta configurado, initPoint trae la URL real de
        // pago y se redirige ahi. En un entorno de demo sin credenciales
        // reales de Mercado Pago, se muestra la confirmacion en pantalla
        // igual (la venta ya quedó creada en estado PENDIENTE).
        if (venta.initPoint) {
          window.location.href = venta.initPoint;
        }
      },
      error: (err) => {
        this.cargando = false;
        this.error = err?.error?.message || 'No se pudo confirmar la compra. Probá de nuevo.';
      }
    });
  }
}
