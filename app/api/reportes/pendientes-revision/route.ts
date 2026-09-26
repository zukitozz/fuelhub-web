import { NextResponse } from "next/server";
import { withSession } from "@/lib/apiRouteHelpers";
import { listarTodasLasCompras } from "@/lib/fuelhub/compras";
import { ESTACIONES } from "@/lib/fuelhub/types";
import type { PendientesPorEstacion } from "@/lib/reportesAgregados";

// GET /api/reportes/pendientes-revision — compras que el Lambda de lectura de correos no pudo
// matchear contra el catálogo, acumuladas por estación (idea #9). Sin filtro de fechas: es una
// bandeja de control de calidad, no un reporte de un período.
export async function GET() {
  return withSession(async () => {
    const compras = await listarTodasLasCompras({ estado: "PENDIENTE_REVISION" });
    const reales = compras.filter((c) => ESTACIONES.some((e) => e.codigo === c.codigoEstacion));

    const porEstacion = new Map<string, number>();
    for (const c of reales) {
      porEstacion.set(c.codigoEstacion, (porEstacion.get(c.codigoEstacion) ?? 0) + 1);
    }

    const resultado: PendientesPorEstacion[] = ESTACIONES.map((e) => ({
      estacion: e.codigo,
      cantidad: porEstacion.get(e.codigo) ?? 0,
    }));

    return NextResponse.json(resultado);
  });
}
