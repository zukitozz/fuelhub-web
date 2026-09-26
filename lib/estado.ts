import type { EstadoCompra } from "./fuelhub/types";

export const ESTADO_LABELS: Record<EstadoCompra, string> = {
  ACTIVO: "Activo",
  ANULADO: "Anulado",
  PENDIENTE_REVISION: "Pendiente de revisión",
};

// Colores planos (no var(--x)) porque EstadoDot los usa inline en el punto de color — las
// variables de badge (--danger, --warning-text) son para texto sobre fondo claro, no para un
// punto sólido pequeño.
export const ESTADO_DOT_COLOR: Record<EstadoCompra, string> = {
  ACTIVO: "#1e7a34",
  ANULADO: "#b3261e",
  PENDIENTE_REVISION: "#8a5300",
};
