import { NextRequest, NextResponse } from "next/server";
import { withSession } from "@/lib/apiRouteHelpers";
import { obtenerReporteAbastecimiento } from "@/lib/fuelhub/reportes";
import { ESTACIONES } from "@/lib/fuelhub/types";

// GET /api/reportes/abastecimiento — autonomía de tanques vs. frecuencia real (sección 5.3), ya
// viene ordenado por más urgente primero. Filtra estaciones sintéticas (SMOKETEST) igual que
// /api/reportes/margen.
export async function GET(req: NextRequest) {
  return withSession(async () => {
    const sp = req.nextUrl.searchParams;
    const data = await obtenerReporteAbastecimiento({
      estacionCodigo: sp.get("estacionCodigo") ?? undefined,
    });
    const reales = data.filter((item) => ESTACIONES.some((e) => e.codigo === item.estacion));
    return NextResponse.json(reales);
  });
}
