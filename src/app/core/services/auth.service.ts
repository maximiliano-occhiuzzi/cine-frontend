import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  AdminUsuarioDTO,
  EditarUsuarioRequest,
  LoginRequest,
  LoginResponse,
  NuevoUsuarioRequest,
  RegistroRequest
} from '../models/auth.models';
import { gatewayUrl } from '../utils/gateway-url.util';

/**
 * Habla con MS Auth a traves del Gateway (/auth/**, que esta permitAll a
 * nivel de Gateway y de Auth para login/registro). La URL se arma con
 * gatewayUrl() en vez de tener "localhost" fijo -ver ese archivo.
 *
 * POST /auth/registro-cliente: alta de autoservicio (siempre rol CLIENTE,
 * nombre+apellido obligatorios) — a diferencia de POST /auth/register, que
 * sigue reservado a ADMIN para crear EMPLEADO/ADMIN.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = gatewayUrl('/auth');

  private tokenKey = 'cine_token';
  private refreshKey = 'cine_refresh_token';
  private usernameKey = 'cine_username';
  private nombreKey = 'cine_nombre';
  private apellidoKey = 'cine_apellido';
  private rolKey = 'cine_rol';

  constructor(private http: HttpClient) {}

  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, data).pipe(
      tap(resp => this.guardarSesion(resp))
    );
  }

  registrarCliente(data: RegistroRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/registro-cliente`, data).pipe(
      tap(resp => this.guardarSesion(resp))
    );
  }

  logout(): void {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      // Best effort: si falla (back caido, etc.) igual se limpia la sesion local.
      this.http.post(`${this.apiUrl}/logout`, { refreshToken }).subscribe({ error: () => {} });
    }
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshKey);
    localStorage.removeItem(this.usernameKey);
    localStorage.removeItem(this.nombreKey);
    localStorage.removeItem(this.apellidoKey);
    localStorage.removeItem(this.rolKey);
  }

  private guardarSesion(resp: LoginResponse): void {
    localStorage.setItem(this.tokenKey, resp.token);
    localStorage.setItem(this.refreshKey, resp.refreshToken);
    localStorage.setItem(this.usernameKey, resp.username);
    localStorage.setItem(this.nombreKey, resp.nombre ?? '');
    localStorage.setItem(this.apellidoKey, resp.apellido ?? '');
    localStorage.setItem(this.rolKey, resp.rol);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getUsername(): string | null {
    return localStorage.getItem(this.usernameKey);
  }

  getNombreCompleto(): string {
    const nombre = localStorage.getItem(this.nombreKey) ?? '';
    const apellido = localStorage.getItem(this.apellidoKey) ?? '';
    return `${nombre} ${apellido}`.trim();
  }

  getRol(): string | null {
    return localStorage.getItem(this.rolKey);
  }

  isAdmin(): boolean {
    return this.getRol() === 'ADMIN';
  }

  isEmpleado(): boolean {
    return this.getRol() === 'EMPLEADO';
  }

  // ADMIN y EMPLEADO comparten el panel de ventas (consultar/cancelar
  // compras de cualquier cliente); solo ADMIN gestiona usuarios.
  puedeGestionarVentas(): boolean {
    return this.isAdmin() || this.isEmpleado();
  }

  // --- Panel de administración de usuarios (todo ADMIN-only, ver SecurityConfig) ---

  listarUsuarios(): Observable<AdminUsuarioDTO[]> {
    return this.http.get<AdminUsuarioDTO[]>(`${this.apiUrl}/usuarios`);
  }

  crearUsuario(data: NuevoUsuarioRequest): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  editarUsuario(username: string, data: EditarUsuarioRequest): Observable<AdminUsuarioDTO> {
    return this.http.put<AdminUsuarioDTO>(`${this.apiUrl}/usuarios/${username}`, data);
  }

  cambiarEstadoUsuario(username: string, habilitado: boolean): Observable<AdminUsuarioDTO> {
    return this.http.patch<AdminUsuarioDTO>(`${this.apiUrl}/usuarios/${username}/estado`, { habilitado });
  }
}
