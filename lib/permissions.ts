// Roles internos de FuelWeb (spec frontend, sección 9): "el mapeo concreto rol → permiso
// todavía no está definido" — esto vive enteramente en FuelWeb, FuelHub Cloud no lo conoce.
//
// Esta es una implementación mínima y deliberadamente permisiva (deja anular a cualquier
// persona autenticada) para no bloquear el desarrollo del resto del módulo. Es el ÚNICO lugar
// que hay que tocar cuando Jorge defina el mapeo real (p.ej. "solo ADMIN anula"): cambiar el
// cuerpo de canAnularCompra, todo lo demás (rutas, UI) ya lee de aquí.

export type FuelWebRole = string | undefined;

export function canAnularCompra(_role: FuelWebRole): boolean {
  // TODO(section 9): reemplazar por el mapeo real de rol → permiso cuando Jorge lo defina.
  // Ejemplo futuro: return role === "ADMIN";
  return true;
}
