import { Injectable } from '@angular/core';
import { ButacaDTO } from '../models/cine.models';

export interface LineaCandy {
  productoId: number;
  nombre: string;
  precio: number;
  cantidad: number;
}

export interface SeleccionFuncion {
  funcionId: number;
  salaId: number;
  precioBase: number;
  peliculaTitulo: string;
}

/**
 * Carrito en memoria, compartido entre mapa-asientos y candy (son rutas
 * distintas en este front, asi que un servicio singleton de Angular -con
 * providedIn: 'root'- es lo que persiste la seleccion al navegar entre
 * ellas sin tener que recurrir a localStorage).
 */
@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  funcion: SeleccionFuncion | null = null;
  butacas: ButacaDTO[] = [];
  candy: LineaCandy[] = [];

  setFuncion(seleccion: SeleccionFuncion): void {
    if (this.funcion?.funcionId !== seleccion.funcionId) {
      // Cambio de funcion: la seleccion de butacas anterior ya no aplica.
      this.butacas = [];
    }
    this.funcion = seleccion;
  }

  setButacas(butacas: ButacaDTO[]): void {
    this.butacas = butacas;
  }

  agregarCandy(productoId: number, nombre: string, precio: number): void {
    const linea = this.candy.find(c => c.productoId === productoId);
    if (linea) {
      linea.cantidad++;
    } else {
      this.candy.push({ productoId, nombre, precio, cantidad: 1 });
    }
  }

  quitarCandy(productoId: number): void {
    const linea = this.candy.find(c => c.productoId === productoId);
    if (!linea) return;
    linea.cantidad--;
    if (linea.cantidad <= 0) {
      this.candy = this.candy.filter(c => c.productoId !== productoId);
    }
  }

  get totalCandy(): number {
    return this.candy.reduce((acc, c) => acc + c.precio * c.cantidad, 0);
  }

  get totalEntradas(): number {
    if (!this.funcion) return 0;
    return this.butacas.length * this.funcion.precioBase;
  }

  get total(): number {
    return this.totalEntradas + this.totalCandy;
  }

  limpiar(): void {
    this.funcion = null;
    this.butacas = [];
    this.candy = [];
  }
}
