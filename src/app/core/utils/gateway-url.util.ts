const GATEWAY_PORT = 8081;

// Arma la URL del Gateway a partir del hostname que el navegador usó para
// abrir la pagina (window.location.hostname), en vez de tener "localhost"
// fijo en el codigo. Si el front se abre como http://localhost:4200,
// window.location.hostname es "localhost" y la URL da igual que antes. Si
// se abre por IP de red (ej. http://172.16.8.78:4200, demo en el aula,
// otra PC, celular en la misma red), window.location.hostname es esa IP, y
// la URL del Gateway la sigue automaticamente -antes, con "localhost"
// hardcodeado, el navegador intentaba pegarle al Gateway en la PROPIA
// maquina del que mira la pagina, no en el servidor real, y todo fallaba.
export function gatewayUrl(path: string = ''): string {
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return `http://${host}:${GATEWAY_PORT}${path}`;
}
