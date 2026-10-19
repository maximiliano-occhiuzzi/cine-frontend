import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductosService } from '../../core/services/productos.service';
import { extraerMensajeError } from '../../core/utils/error.util';
import { Confiteria, ConfiteriaFormDTO, TipoConfiteria } from '../../core/models/cine.models';

const FORM_VACIO: ConfiteriaFormDTO = {
  nombre: '',
  descripcion: '',
  precio: 0,
  stock: 0,
  categoria: TipoConfiteria.COMIDA,
  imagenUrl: ''
};

@Component({
  selector: 'app-admin-confiteria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-confiteria.component.html',
  styleUrls: ['./admin-confiteria.component.css']
})
export class AdminConfiteriaComponent implements OnInit {
  categorias = Object.values(TipoConfiteria);
  productos: Confiteria[] = [];
  cargando = true;
  error = '';
  mensaje = '';

  mostrarForm = false;
  editandoId: number | null = null;
  form: ConfiteriaFormDTO = { ...FORM_VACIO };

  constructor(private productosService: ProductosService) {}

  ngOnInit(): void {
    this.cargar();
  }

  // Esta pantalla antes solo pedia el catalogo una vez, al entrar. Si el
  // admin la dejaba abierta en una pestaña y el stock cambiaba por una
  // compra hecha en otro lado (otra pestaña, otro usuario), se quedaba
  // mostrando numeros viejos hasta que se navegaba afuera y volvia. Al
  // volver el foco a esta pestaña, se refresca sola.
  @HostListener('window:focus')
  alRecuperarFoco(): void {
    if (!this.mostrarForm) {
      this.cargar();
    }
  }

  cargar(): void {
    this.cargando = true;
    this.productosService.obtenerTodaLaConfiteria().subscribe({
      next: (data) => {
        this.productos = data;
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el catálogo.';
        this.cargando = false;
      }
    });
  }

  nuevoProducto(): void {
    this.editandoId = null;
    this.form = { ...FORM_VACIO };
    this.mostrarForm = true;
    this.mensaje = '';
  }

  editar(p: Confiteria): void {
    this.editandoId = p.id;
    this.form = {
      nombre: p.nombre,
      descripcion: p.descripcion,
      precio: p.precio,
      stock: p.stock ?? 0,
      categoria: p.tipo,
      imagenUrl: p.imagen && p.imagen.startsWith('http') ? p.imagen : ''
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
      ? this.productosService.editarProducto(this.editandoId, this.form)
      : this.productosService.crearProducto(this.form);

    obs.subscribe({
      next: () => {
        this.mensaje = this.editandoId ? 'Producto actualizado.' : 'Producto creado.';
        this.mostrarForm = false;
        this.editandoId = null;
        this.cargar();
      },
      error: (err) => {
        this.mensaje = extraerMensajeError(err, 'No se pudo guardar el producto.');
      }
    });
  }

  darDeBaja(p: Confiteria): void {
    if (!confirm(`¿Dar de baja "${p.nombre}"?`)) return;
    this.productosService.eliminarProducto(p.id).subscribe({
      next: () => this.cargar(),
      error: () => this.mensaje = 'No se pudo dar de baja el producto.'
    });
  }

  reactivar(p: Confiteria): void {
    this.productosService.reactivarProducto(p.id).subscribe({
      next: () => this.cargar(),
      error: () => this.mensaje = 'No se pudo reactivar el producto.'
    });
  }
}
