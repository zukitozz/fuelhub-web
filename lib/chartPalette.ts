// Paleta de referencia validada de la skill de dataviz (references/palette.md) — 8 tonos
// categóricos en un orden FIJO (el orden es el mecanismo de seguridad CVD, no algo cosmético)
// más los 4 colores de estado. Validado con scripts/validate_palette.js el 2026-09-26: PASS en
// banda de luminosidad, piso de croma, separación CVD y piso de visión normal; WARN de contraste
// en aqua/amarillo/magenta — por eso esos tonos nunca se usan como color de texto, siempre como
// marca (barra/línea/punto) acompañada de leyenda + etiqueta directa.
export const CHART_SERIES = [
  "#2a78d6", // 1 azul
  "#eb6834", // 2 naranja
  "#1baf7a", // 3 aqua
  "#eda100", // 4 amarillo
  "#e87ba4", // 5 magenta
  "#008300", // 6 verde
  "#4a3aa7", // 7 violeta
  "#e34948", // 8 rojo
] as const;

export const CHART_STATUS = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
} as const;

export const CHART_INK = {
  primary: "#0b0b0b",
  secondary: "#52514e",
  muted: "#898781",
};

export const CHART_GRID = "#e1e0d9";
export const CHART_SURFACE = "#fcfcfb";

// Único hue secuencial para magnitud de una sola serie (rankings, totales por categoría) — un
// solo color, nunca un arcoíris para "comparar magnitud" (references/choosing-a-form.md).
export const CHART_SEQUENTIAL = "#2a78d6";

const ESTACION_ORDEN = ["CHANCAYLLO", "MALA", "ANDAHUASI", "PACHACUTEC"] as const;

/** Asigna colores categóricos a estaciones en un orden FIJO, no por el orden en que las devuelve
 * la API — si el color dependiera de qué estaciones trae cada respuesta, un filtro que cambia la
 * cantidad de series repintaría a las que quedan (regla: "color sigue a la entidad, nunca a su
 * posición"). Estaciones fuera del catálogo fijo (ej. SMOKETEST) caen al último slot. */
export function colorEstacion(codigo: string): string {
  const index = ESTACION_ORDEN.indexOf(codigo as (typeof ESTACION_ORDEN)[number]);
  return CHART_SERIES[index === -1 ? CHART_SERIES.length - 1 : index] ?? CHART_SERIES[0];
}
