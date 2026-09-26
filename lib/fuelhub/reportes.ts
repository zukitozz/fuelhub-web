// Funciones de dominio para los reportes de solo lectura de FuelHub Cloud
// (spec-agente-reportes-fuelhub.md) — misma capa/convención que lib/fuelhub/compras.ts.

import { FuelHubApiError, fuelhubFetch } from "./client";
import type { ReporteAbastecimientoItem, ReporteDia, ReporteMargenItem } from "./types";

/** GET /reportes/dia — un día puntual, una sola estación por llamada. Un 404 significa "no hay
 * cierre ACTIVO para esa fecha/estación" (día no cerrado, o cierre anulado) — es un estado vacío
 * normal de la UI, no un error, así que se resuelve como `null` en vez de lanzar. */
export async function obtenerReporteDia(params: {
  fechaNegocio: string;
  estacionCodigo?: string;
}): Promise<ReporteDia | null> {
  try {
    return await fuelhubFetch<ReporteDia>("/reportes/dia", { query: params });
  } catch (err) {
    if (err instanceof FuelHubApiError && err.status === 404) return null;
    throw err;
  }
}

/** GET /reportes/margen — si se omite estacionCodigo con un token de scope comodín, devuelve
 * TODAS las estaciones en el mismo array (a diferencia de /reportes/dia). */
export function obtenerReporteMargen(params: {
  fechaDesde?: string;
  fechaHasta?: string;
  estacionCodigo?: string;
}): Promise<ReporteMargenItem[]> {
  return fuelhubFetch<ReporteMargenItem[]>("/reportes/margen", { query: params });
}

/** GET /reportes/abastecimiento — ya viene ordenado por más urgente primero. */
export function obtenerReporteAbastecimiento(params: {
  estacionCodigo?: string;
}): Promise<ReporteAbastecimientoItem[]> {
  return fuelhubFetch<ReporteAbastecimientoItem[]>("/reportes/abastecimiento", { query: params });
}
