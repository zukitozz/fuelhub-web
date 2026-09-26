import { NextRequest, NextResponse } from "next/server";
import { withSession } from "@/lib/apiRouteHelpers";
import { listarTodasLasCompras } from "@/lib/fuelhub/compras";
import { ESTACIONES } from "@/lib/fuelhub/types";
import type { ProveedorAgregado } from "@/lib/reportesAgregados";

// GET /api/reportes/proveedores — distribución de compras por proveedor en un período (idea #7).
// Solo ACTIVO: compras ANULADO no representan gasto real, y PENDIENTE_REVISION no está confirmada
// todavía — mezclarlas distorsionaría el total.
export async function GET(req: NextRequest) {
  return withSession(async () => {
    const sp = req.nextUrl.searchParams;
    const compras = await listarTodasLasCompras({
      estado: "ACTIVO",
      fechaDesde: sp.get("fechaDesde") ?? undefined,
      fechaHasta: sp.get("fechaHasta") ?? undefined,
      estacionCodigo: sp.get("estacionCodigo") ?? undefined,
    });
    const reales = compras.filter((c) => ESTACIONES.some((e) => e.codigo === c.codigoEstacion));

    const porProveedor = new Map<string, ProveedorAgregado>();
    for (const c of reales) {
      const actual = porProveedor.get(c.proveedor) ?? {
        proveedor: c.proveedor,
        costoTotal: 0,
        cantidadCompras: 0,
      };
      actual.costoTotal += c.costoTotal;
      actual.cantidadCompras += 1;
      porProveedor.set(c.proveedor, actual);
    }

    const resultado = Array.from(porProveedor.values()).sort((a, b) => b.costoTotal - a.costoTotal);
    return NextResponse.json(resultado);
  });
}
