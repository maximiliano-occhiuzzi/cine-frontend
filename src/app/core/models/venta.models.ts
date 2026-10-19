export interface ProductoCompraDTO {
  productoId: number;
  cantidad: number;
}

export interface VentaAltaDTO {
  funcionId: number;
  butacaIds: number[];
  productos: ProductoCompraDTO[];
  peliculaTitulo: string | null;
}

export interface VentaButacaDTO {
  butacaId: number;
  fila: string;
  numero: number;
}

export interface VentaProductoDTO {
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface VentaDTO {
  id: number;
  username: string;
  funcionId: number;
  peliculaTitulo: string | null;
  butacas: VentaButacaDTO[];
  estado: string;
  estadoReembolso: string;
  total: number;
  fecha: string;
  productos: VentaProductoDTO[];
  initPoint: string | null;
  // true si esta venta llegó a tener una preferencia de pago real en algún
  // momento (puede no estar pagada todavía). No confundir con initPoint,
  // que solo viaja completo en la respuesta de comprar/reintentar-pago.
  tienePreferenciaDePago: boolean;
}
