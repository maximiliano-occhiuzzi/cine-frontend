import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProductosService } from '../../core/services/productos.service';
import { CarritoService } from '../../core/services/carrito.service';
import { Confiteria } from '../../core/models/cine.models';

@Component({
  selector: 'app-candy',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './candy.component.html',
  styleUrls: ['./candy.component.css']
})
export class CandyComponent implements OnInit {
  productos: Confiteria[] = [];
  categoriaSeleccionada: string = 'TODOS';

  // Mensaje de "no hay más stock" por producto (se borra solo a los pocos
  // segundos). Antes esto no se validaba nunca acá — el backend lo
  // rechazaba recién al confirmar la compra, y para colmo no había forma de
  // bajar la cantidad una vez agregada.
  errorStockPorProducto: { [productoId: number]: string } = {};

  constructor(
    private productosService: ProductosService,
    public carritoService: CarritoService,
    private router: Router
  ) {}

  get enFlujoDeCompra(): boolean {
    return !!this.carritoService.funcion;
  }

  siguiente(): void {
    this.router.navigate(['/checkout']);
  }

  ngOnInit(): void {
    this.productosService.obtenerConfiteria().subscribe({
      next: (data) => this.productos = data,
      error: (err) => console.error(err)
    });
  }

  get productosFiltrados(): Confiteria[] {
    if (this.categoriaSeleccionada === 'TODOS') return this.productos;
    return this.productos.filter(p => p.tipo === this.categoriaSeleccionada);
  }

  // El carrito de confiteria vive en un solo lugar (CarritoService): antes
  // habia un array local acá ADEMAS del de CarritoService, y se
  // desincronizaban. Esto evita esa clase de bug.
  cantidadEnCarrito(prod: Confiteria): number {
    return this.carritoService.candy.find(c => c.productoId === prod.id)?.cantidad ?? 0;
  }

  sinStockDisponible(prod: Confiteria): boolean {
    if (prod.stock == null) return false; // sin dato de stock: no se limita
    return this.cantidadEnCarrito(prod) >= prod.stock;
  }

  agregarAlCarrito(prod: Confiteria): void {
    if (this.sinStockDisponible(prod)) {
      this.errorStockPorProducto[prod.id] = `Solo quedan ${prod.stock} unidades de "${prod.nombre}".`;
      setTimeout(() => delete this.errorStockPorProducto[prod.id], 3000);
      return;
    }
    this.carritoService.agregarCandy(prod.id, prod.nombre, prod.precio);
  }

  quitarDelCarrito(prod: Confiteria): void {
    this.carritoService.quitarCandy(prod.id);
  }

  get totalCarrito(): number {
    return this.carritoService.totalCandy;
  }
}
