export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegistroRequest {
  username: string;
  password: string;
  nombre: string;
  apellido: string;
  email: string;
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  refreshToken: string;
  username: string;
  nombre: string;
  apellido: string;
  rol: string;
  expiresInSeconds: number;
}

// Lo que ve el panel de admin por cada usuario (a diferencia de lo que
// recibe Ventas via Feign, acá sí viajan id/rol/habilitado).
export interface AdminUsuarioDTO {
  id: number;
  username: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: 'ADMIN' | 'EMPLEADO' | 'CLIENTE';
  habilitado: boolean;
}

// Body de POST /auth/register (crear un usuario nuevo desde el admin,
// con cualquier rol) — a diferencia de RegistroRequest (autoservicio,
// siempre CLIENTE), este sí permite elegir el rol.
export interface NuevoUsuarioRequest {
  username: string;
  password: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: 'ADMIN' | 'EMPLEADO' | 'CLIENTE';
}

// Body de PUT /auth/usuarios/{username}.
export interface EditarUsuarioRequest {
  nombre: string;
  apellido: string;
  email: string;
  rol: 'ADMIN' | 'EMPLEADO' | 'CLIENTE';
}
