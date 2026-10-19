import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VentaAltaDTO, VentaDTO } from '../models/venta.models';
import { gatewayUrl } from '../utils/gateway-url.util';

/**
 * Habla con MS Ventas a traves del Gateway. POST /ventas requiere estar
 * logueado (el interceptor le agrega el JWT); el Gateway lo transforma en
 * la cabecera X-User-Username que lee VentaController.
 */
@Injectable({
  providedIn: 'root'
})
export class VentasService {
  private apiUrl = gatewayUrl('/ventas');

  constructor(private http: HttpClient) {}

  comprar(dto: VentaAltaDTO): Observable<VentaDTO> {
    return this.http.post<VentaDTO>(this.apiUrl, dto);
  }

  misCompras(): Observable<VentaDTO[]> {
    return this.http.get<VentaDTO[]>(`${this.apiUrl}/mias`);
  }

  // Listado completo (ADMIN/EMPLEADO) para el panel de administracion de
  // ventas — el filtrado por usuario/estado se hace en el componente,
  // el backend ya devuelve todo de una.
  listarTodas(): Observable<VentaDTO[]> {
    return this.http.get<VentaDTO[]>(this.apiUrl);
  }

  cancelar(id: number): Observable<VentaDTO> {
    return this.http.post<VentaDTO>(`${this.apiUrl}/${id}/cancelar`, {});
  }

  // Vuelve a pedir un link de pago para una compra propia que quedo
  // PENDIENTE sin link real (Mercado Pago la rechazo o no respondio la
  // primera vez). Devuelve la venta con un initPoint nuevo para redirigir.
  reintentarPago(id: number): Observable<VentaDTO> {
    return this.http.post<VentaDTO>(`${this.apiUrl}/${id}/reintentar-pago`, {});
  }
}
