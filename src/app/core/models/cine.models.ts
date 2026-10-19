export enum EstadoButaca {
  DISPONIBLE = 'DISPONIBLE',
  OCUPADO = 'OCUPADO'
}

export enum TipoSala {
  SALA_2D = 'SALA_2D',
  SALA_3D = 'SALA_3D',
  IMAX = 'IMAX',
  VIP = 'VIP'
}

export enum TipoConfiteria {
  COMIDA = 'COMIDA',
  BEBIDA = 'BEBIDA',
  COMBO = 'COMBO',
  MERCHANDISING = 'MERCHANDISING'
}

export interface Pelicula {
  id: number;
  titulo: string;
  genero: string;
  duracion: number;
  director: string;
  guionista?: string;
  // ISO yyyy-MM-dd (LocalDate del backend). Opcional: una pelicula puede no
  // tener fecha de estreno cargada todavia.
  fechaEstreno?: string;
  sinopsis: string;
  clasificacionEdad: string;
  calificacion: number;
  poster: string;
  reparto?: string;
  formatoDisponible?: string;
  activo?: boolean;
}

// Payload para alta/edicion de pelicula (lo que espera el backend real,
// POST/PUT /productos/peliculas).
export interface PeliculaFormDTO {
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
}

export interface Confiteria {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock?: number;
  estado: string;
  tipo: TipoConfiteria;
  imagen?: string;
  activo?: boolean;
}

// Payload para alta/edicion de confiteria (lo que espera el backend real,
// POST/PUT /productos).
export interface ConfiteriaFormDTO {
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoria: TipoConfiteria;
  imagenUrl?: string;
}

export interface Sala {
  id: number;
  nombre: string;
  capacidad: number;
  tipo: TipoSala;
}

// Alta: genera el mapa de butacas (filas x asientosPorFila) junto con la sala.
export interface SalaAltaFormDTO {
  nombre: string;
  tipo: TipoSala;
  filas: number;
  asientosPorFila: number;
}

// Edicion: a proposito sin filas/asientosPorFila (cambiar el mapa de butacas
// de una sala ya creada rompería las referencias de ventas ya hechas).
export interface SalaEditarFormDTO {
  nombre: string;
  tipo: TipoSala;
}

export interface FuncionResponseDTO {
  id: number;
  salaId: number;
  nombreSala: string;
  peliculaId: number;
  fechaHora: string;
  precioBase: number;
}

// Alta: hace falta elegir la sala.
export interface FuncionAltaFormDTO {
  salaId: number;
  peliculaId: number;
  fechaHora: string;
  precioBase: number;
}

// Edicion: a proposito sin salaId (no se puede cambiar de sala una funcion
// que ya puede tener entradas vendidas referenciando butacas de esa sala).
export interface FuncionEditarFormDTO {
  peliculaId: number;
  fechaHora: string;
  precioBase: number;
}

export interface ButacaDTO {
  id: number;
  salaId: number;
  fila: string;
  numero: number;
  estado: EstadoButaca;
  seleccionada?: boolean;
}

export interface ActualizarEstadoButacaDTO {
  estado: EstadoButaca;
}