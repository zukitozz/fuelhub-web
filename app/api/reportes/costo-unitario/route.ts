import { NextRequest, NextResponse } from "next/server";
import { withSession } from "@/lib/apiRouteHelpers";
import { FuelHubApiError } from "@/lib/fuelhub/client";
import { listarTodasLasCompras } from "@/lib/fuelhub/compras";
import type { CostoUnitarioPunto } from "@/lib/reportesAgregados";

// GET /api/reportes/costo-unitario?productoId=... — evolución del costo unitario de un producto
// en el tiempo, para detectar subidas de precio de un proveedor (idea #8). Solo ACTIVO por la
// misma razón que /api/reportes/proveedores.
export async function GET(req: NextRequest) {
  return withSession(async () => {
    const sp = req.nextUrl.searchParams;
    const productoId = sp.get("productoId");
    if (!productoId) {
      throw new FuelHubApiError(400, { error: "PARAMETRO_FALTANTE", message: "productoId es requerido." });
    }

    const compras = await listarTodasLasCompras({
      estado: "ACTIVO",
      productoId,
      fechaDesde: sp.get("fechaDesde") ?? undefined,
      fechaHasta: sp.get("fechaHasta") ?? undefined,
    });

    const puntos: CostoUnitarioPunto[] = compras
      .map((c) => ({ fecha: c.fecha, costoUnitario: c.costoUnitario, proveedor: c.proveedor }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    return NextResponse.json(puntos);
  });
}
