import { NextRequest, NextResponse } from "next/server";
import { withSession } from "@/lib/apiRouteHelpers";
import { listarTodasLasCompras } from "@/lib/fuelhub/compras";
import { ESTACIONES } from "@/lib/fuelhub/types";
import type { MermaPorEstacion } from "@/lib/reportesAgregados";

// GET /api/reportes/merma — merma acumulada por estación en un período (idea #11). `merma` viene
// `null` cuando la compra todavía no tiene destino/tanque registrado — NO es cero, así que se
// ignora en la suma en vez de tratarla como 0 (sección 5.4).
export async function GET(req: NextRequest) {
  return withSession(async () => {
    const sp = req.nextUrl.searchParams;
    const compras = await listarTodasLasCompras({
      estado: "ACTIVO",
      fechaDesde: sp.get("fechaDesde") ?? undefined,
      fechaHasta: sp.get("fechaHasta") ?? undefined,
    });
    const reales = compras.filter((c) => ESTACIONES.some((e) => e.codigo === c.codigoEstacion));

    const porEstacion = new Map<string, number>();
    for (const c of reales) {
      if (c.merma === null || c.merma === undefined) continue;
      porEstacion.set(c.codigoEstacion, (porEstacion.get(c.codigoEstacion) ?? 0) + c.merma);
    }

    const resultado: MermaPorEstacion[] = ESTACIONES.map((e) => ({
      estacion: e.codigo,
      merma: porEstacion.get(e.codigo) ?? 0,
    }));

    return NextResponse.json(resultado);
  });
}
