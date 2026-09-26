import { NextRequest, NextResponse } from "next/server";
import { withSession } from "@/lib/apiRouteHelpers";
import { obtenerReporteMargen } from "@/lib/fuelhub/reportes";
import { ESTACIONES } from "@/lib/fuelhub/types";

// GET /api/reportes/margen — margen estimado por estación en un rango (sección 5.2). Si se omite
// estacionCodigo, FuelHub Cloud devuelve TODAS las estaciones (token M2M con scope comodín,
// confirmado 2026-09-26) incluida SMOKETEST — se filtra acá, nunca debe llegar a un reporte real.
export async function GET(req: NextRequest) {
  return withSession(async () => {
    const sp = req.nextUrl.searchParams;
    const data = await obtenerReporteMargen({
      fechaDesde: sp.get("fechaDesde") ?? undefined,
      fechaHasta: sp.get("fechaHasta") ?? undefined,
      estacionCodigo: sp.get("estacionCodigo") ?? undefined,
    });
    const reales = data.filter((item) => ESTACIONES.some((e) => e.codigo === item.estacion));
    return NextResponse.json(reales);
  });
}
