import { NextRequest, NextResponse } from "next/server";
import { withSession } from "@/lib/apiRouteHelpers";
import { FuelHubApiError } from "@/lib/fuelhub/client";
import { obtenerReporteDia } from "@/lib/fuelhub/reportes";
import type { ApiErrorBody, ReporteDia } from "@/lib/fuelhub/types";

// GET /api/reportes/dia — ventas de un día puntual, una estación (spec-agente-reportes-fuelhub.md
// sección 5.1). Nunca hay más de una petición en vuelo por gráfico de pastel.
export async function GET(req: NextRequest): Promise<NextResponse<ReporteDia | ApiErrorBody>> {
  return withSession(async () => {
    const sp = req.nextUrl.searchParams;
    const fechaNegocio = sp.get("fechaNegocio");
    if (!fechaNegocio) {
      throw new FuelHubApiError(400, {
        error: "PARAMETRO_FALTANTE",
        message: "fechaNegocio es requerido (YYYY-MM-DD).",
      });
    }

    const reporte = await obtenerReporteDia({
      fechaNegocio,
      estacionCodigo: sp.get("estacionCodigo") ?? undefined,
    });

    if (!reporte) {
      throw new FuelHubApiError(404, {
        error: "RECURSO_NO_ENCONTRADO",
        message: "No hay cierre de día registrado para esa fecha/estación.",
      });
    }

    return NextResponse.json(reporte);
  });
}
