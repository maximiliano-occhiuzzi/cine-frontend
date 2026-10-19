import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  Pelicula,
  PeliculaFormDTO,
  Confiteria,
  ConfiteriaFormDTO,
  TipoConfiteria
} from '../models/cine.models';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  private apiUrl = 'http://localhost:8081/productos';

  // Mocks: solo se usan como fallback si el backend no responde (apagado,
  // red, demo sin levantar todo), para no dejar las pantallas vacias.
  private mockPeliculas: Pelicula[] = [
    {
      id: 1,
      titulo: 'RESIDENT EVIL: NOCHE CERO',
      genero: 'Terror / Acción',
      duracion: 114,
      director: 'Zach Cregger',
      fechaEstreno: '2025-09-25',
      sinopsis: 'Llega la aterradora reinvención de la saga de terror más aclamada de los videojuegos, ambientada en las oscuras instalaciones de la Corporación Umbrella.',
      clasificacionEdad: 'R-17',
      calificacion: 4.8,
      poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop',
      reparto: 'Zachary Levi, Kaya Scodelario',
      formatoDisponible: 'IMAX 3D / DBOX'
    },
    {
      id: 2,
      titulo: 'SPIDER-MAN: BEYOND THE SPIDER-VERSE',
      genero: 'Animación / Acción',
      duracion: 140,
      director: 'Joaquim Dos Santos',
      fechaEstreno: '2026-03-12',
      sinopsis: 'Miles Morales emprende un viaje épico a través del Multiverso para salvar a sus seres queridos de una amenaza cataclísmica imprevista.',
      clasificacionEdad: 'SAM 13',
      calificacion: 4.9,
      poster: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=600&auto=format&fit=crop',
      reparto: 'Shameik Moore, Hailee Steinfeld',
      formatoDisponible: '2D / 3D / ATMOS'
    },
    {
      id: 3,
      titulo: 'OPPENHEIMER',
      genero: 'Drama / Historia',
      duracion: 180,
      director: 'Christopher Nolan',
      fechaEstreno: '2023-07-20',
      sinopsis: 'La historia del físico teórico J. Robert Oppenheimer y su papel fundamental en el desarrollo de las primeras armas nucleares.',
      clasificacionEdad: 'SAM 16',
      calificacion: 5.0,
      poster: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=600&auto=format&fit=crop',
      reparto: 'Cillian Murphy, Emily Blunt, Matt Damon',
      formatoDisponible: 'IMAX 70MM / 2D'
    }
  ];

  private mockCandy: Confiteria[] = [
    {
      id: 1,
      nombre: 'Combo Mega Pochoclo + 2 Gaseosas',
      descripcion: '1 Balde de pochoclos gigantes (Dulces o Salados) + 2 Gaseosas grandes de 1L.',
      precio: 14500,
      estado: 'DISPONIBLE',
      tipo: TipoConfiteria.COMBO,
      imagen: '🍿'
    },
    {
      id: 2,
      nombre: 'Nacho Supreme con Queso Cheddar',
      descripcion: 'Caja de nachos crocantes con salsa de queso cheddar caliente y jalapeños.',
      precio: 8900,
      estado: 'DISPONIBLE',
      tipo: TipoConfiteria.COMIDA,
      imagen: '🧀'
    },
    {
      id: 3,
      nombre: 'Gaseosa Grande 1 Litro',
      descripcion: 'Coca-Cola, Coca Zero, Sprite o Fanta helada de 1000ml.',
      precio: 4500,
      estado: 'DISPONIBLE',
      tipo: TipoConfiteria.BEBIDA,
      imagen: '🥤'
    },
    {
      id: 4,
      nombre: 'Vaso Coleccionable Resident Evil',
      descripcion: 'Vaso de edición limitada de 1.2L con figura 3D en la tapa.',
      precio: 12000,
      estado: 'DISPONIBLE',
      tipo: TipoConfiteria.MERCHANDISING,
      imagen: '🥤⭐'
    }
  ];

  constructor(private http: HttpClient) {}

  // ----------------- PELICULAS -----------------

  // GET /productos/peliculas -> solo activas (cartelera publica).
  obtenerPeliculas(): Observable<Pelicula[]> {
    return this.http.get<PeliculaBackendDTO[]>(`${this.apiUrl}/peliculas`).pipe(
      map(data => data.map(p => this.aPelicula(p))),
      catchError(() => of(this.mockPeliculas))
    );
  }

  // GET /productos/peliculas/todas -> incluye las dadas de baja (solo para admin).
  obtenerTodasLasPeliculas(): Observable<Pelicula[]> {
    return this.http.get<PeliculaBackendDTO[]>(`${this.apiUrl}/peliculas/todas`).pipe(
      map(data => data.map(p => this.aPelicula(p)))
    );
  }

  crearPelicula(dto: PeliculaFormDTO): Observable<Pelicula> {
    return this.http.post<PeliculaBackendDTO>(`${this.apiUrl}/peliculas`, this.limpiarPayload(dto)).pipe(
      map(p => this.aPelicula(p))
    );
  }

  editarPelicula(id: number, dto: PeliculaFormDTO): Observable<Pelicula> {
    return this.http.put<PeliculaBackendDTO>(`${this.apiUrl}/peliculas/${id}`, this.limpiarPayload(dto)).pipe(
      map(p => this.aPelicula(p))
    );
  }

  // El input type="date" del form manda "" (string vacio) cuando queda sin
  // completar, y Jackson no puede parsear eso como LocalDate (tira 400).
  // Lo convierte a null, que si es un campo opcional en el backend.
  private limpiarPayload(dto: PeliculaFormDTO): PeliculaFormDTO {
    return { ...dto, fechaEstreno: dto.fechaEstreno ? dto.fechaEstreno : undefined };
  }

  eliminarPelicula(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/peliculas/${id}`);
  }

  private aPelicula(p: PeliculaBackendDTO): Pelicula {
    return {
      id: p.id,
      titulo: p.titulo,
      genero: p.genero,
      duracion: p.duracion,
      director: p.director,
      guionista: p.guionista,
      fechaEstreno: p.fechaEstreno,
      sinopsis: p.sinopsis,
      clasificacionEdad: p.clasificacionEdad,
      calificacion: p.calificacion,
      poster: p.poster,
      reparto: p.reparto,
      formatoDisponible: p.formatoDisponible,
      activo: p.activo
    };
  }

  // ----------------- CONFITERIA -----------------

  // GET /productos paginado (Page<ProductoSalidaDTO>). Pide una pagina
  // grande para traer todo el catalogo activo de una.
  obtenerConfiteria(): Observable<Confiteria[]> {
    return this.http.get<PaginaProductos>(`${this.apiUrl}?size=100`).pipe(
      map(pagina => pagina.content
        .filter(p => p.activo)
        .map(p => this.aConfiteria(p))),
      catchError(() => of(this.mockCandy))
    );
  }

  // Para la pantalla de administracion: incluye tambien los dados de baja.
  obtenerTodaLaConfiteria(): Observable<Confiteria[]> {
    return this.http.get<PaginaProductos>(`${this.apiUrl}?size=100&incluirInactivos=true`).pipe(
      map(pagina => pagina.content.map(p => this.aConfiteria(p)))
    );
  }

  crearProducto(dto: ConfiteriaFormDTO): Observable<Confiteria> {
    return this.http.post<ProductoBackendDTO>(`${this.apiUrl}`, dto).pipe(
      map(p => this.aConfiteria(p))
    );
  }

  editarProducto(id: number, dto: ConfiteriaFormDTO): Observable<Confiteria> {
    return this.http.put<ProductoBackendDTO>(`${this.apiUrl}/${id}`, dto).pipe(
      map(p => this.aConfiteria(p))
    );
  }

  eliminarProducto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  reactivarProducto(id: number): Observable<Confiteria> {
    return this.http.patch<ProductoBackendDTO>(`${this.apiUrl}/${id}/reactivar`, {}).pipe(
      map(p => this.aConfiteria(p))
    );
  }

  ajustarStock(id: number, cantidad: number): Observable<Confiteria> {
    return this.http.patch<ProductoBackendDTO>(`${this.apiUrl}/${id}/stock`, { cantidad }).pipe(
      map(p => this.aConfiteria(p))
    );
  }

  private aConfiteria(p: ProductoBackendDTO): Confiteria {
    return {
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      precio: p.precio,
      stock: p.stock,
      estado: p.stock > 0 ? 'DISPONIBLE' : 'AGOTADO',
      tipo: p.categoria,
      // Si el producto no tiene imagen cargada, se cae a un emoji segun categoria.
      imagen: p.imagenUrl || this.emojiPorCategoria(p.categoria),
      activo: p.activo
    };
  }

  private emojiPorCategoria(categoria: TipoConfiteria): string {
    switch (categoria) {
      case TipoConfiteria.COMIDA: return '🍿';
      case TipoConfiteria.BEBIDA: return '🥤';
      case TipoConfiteria.COMBO: return '🍿🥤';
      case TipoConfiteria.MERCHANDISING: return '⭐';
      default: return '🍿';
    }
  }
}

// Forma real de PeliculaSalidaDTO (MS Productos, /productos/peliculas).
interface PeliculaBackendDTO {
  id: number;
  titulo: string;
  genero: string;
  duracion: number;
  director: string;
  guionista?: string;
  fechaEstreno?: string;
  sinopsis: string;
  clasificacionEdad: string;
  calificacion: number;
  poster: string;
  reparto?: string;
  formatoDisponible?: string;
  activo: boolean;
}

// Forma real de ProductoSalidaDTO (MS Productos, GET /productos).
interface ProductoBackendDTO {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoria: TipoConfiteria;
  imagenUrl?: string;
  activo: boolean;
}

interface PaginaProductos {
  content: ProductoBackendDTO[];
}
