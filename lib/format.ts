// Formato de fechas en hora de Lima (spec frontend, sección 6: "mostrar siempre convertido a
// hora de Lima (-05:00) en la UI, sin asumir que el offset del navegador del usuario coincide").

const LIMA_TZ = "America/Lima";

export function formatFechaHoraLima(iso: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: LIMA_TZ,
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

/** FuelHub Cloud a veces manda fechaNegocio con hora pegada ("2025-09-13 00:00:00") en vez del
 * date puro documentado en el contrato — se descarta todo lo que no sea la parte YYYY-MM-DD
 * antes de separar por "-", si no el día termina siendo "13 00:00:00". */
function partesFechaNegocio(fecha: string): { anio: string; mes: string; dia: string } | null {
  const soloFecha = fecha.split(/[ T]/)[0] ?? fecha;
  const [anio, mes, dia] = soloFecha.split("-");
  return anio && mes && dia ? { anio, mes, dia } : null;
}

/** Para fechaNegocio, que ya viene como date puro (sin hora) — se muestra tal cual, sin
 * reinterpretar zona horaria (spec: "son date puro (sin hora) en horario de Lima"). */
export function formatFechaNegocio(fecha: string): string {
  const p = partesFechaNegocio(fecha);
  return p ? `${p.dia}/${p.mes}/${p.anio}` : fecha;
}

/** Versión corta (día/mes, sin año) para espacios reducidos como las tarjetas en mobile. */
export function formatFechaCorta(fecha: string): string {
  const p = partesFechaNegocio(fecha);
  return p ? `${p.dia}/${p.mes}` : fecha;
}

/** creadoEn llega como "YYYY-MM-DD HH:mm:ss.ssssss" (espacio, sin offset) — el servidor de
 * FuelHub Cloud corre en UTC, así que se asume UTC y se muestra convertido a hora de Lima. Si
 * algún día llega con offset propio (ISO real), se respeta tal cual en vez de forzar "Z". */
export function formatFechaRegistro(creadoEn: string): string {
  const tieneOffset = /(?:[zZ]|[+-]\d{2}:\d{2})$/.test(creadoEn);
  const iso = tieneOffset ? creadoEn.replace(" ", "T") : `${creadoEn.replace(" ", "T")}Z`;
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime()) ? creadoEn : formatFechaHoraLima(iso);
}

export function formatMoneda(valor: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(valor);
}

export function formatCantidad(valor: number): string {
  return new Intl.NumberFormat("es-PE", { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(
    valor
  );
}
