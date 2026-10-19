/**
 * Los backends de este proyecto devuelven errores en algunas de estas formas
 * segun el modulo y el tipo de excepcion (ver GlobalExceptionHandler de cada
 * uno):
 *   - { "message": "...", "details": [...], ... }   -> ApiError (Ventas, Salas, Gmail, Factura)
 *   - { "mensaje": "..." }                           -> forma vieja, todavia usada por Productos
 *   - { "campo1": "mensaje1", "campo2": "mensaje2" } -> errores de validacion (@Valid, 400) sin envolver
 * Antes esto solo miraba "mensaje", asi que cualquier error que viniera con
 * la forma de ApiError (ej. Ventas: cancelar, reintentar pago, admin/ventas)
 * caia directo al fallback de "unir todos los campos string", mezclando
 * "message" con "error" y "path" en un texto ilegible para el usuario.
 */
export function extraerMensajeError(err: any, fallback: string): string {
  const body = err?.error;
  if (!body || typeof body !== 'object') return fallback;

  if (typeof body.message === 'string') {
    // ApiError: si hay detalles de validacion (uno por campo), se muestran
    // junto al mensaje general en vez de perderse.
    if (Array.isArray(body.details) && body.details.length > 0) {
      return `${body.message}: ${body.details.join(' — ')}`;
    }
    return body.message;
  }

  if (typeof body.mensaje === 'string') {
    return body.mensaje;
  }

  const mensajesDeValidacion = Object.values(body).filter(v => typeof v === 'string') as string[];
  if (mensajesDeValidacion.length > 0) {
    return mensajesDeValidacion.join(' — ');
  }

  return fallback;
}
