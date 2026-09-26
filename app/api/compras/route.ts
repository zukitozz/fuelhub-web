import { NextRequest, NextResponse } from "next/server";
import { withSession } from "@/lib/apiRouteHelpers";
import { crearCompra, limpiarUpdateInput, listarCompras } from "@/lib/fuelhub/compras";
import type { CompraCreateInput, Categoria, EstadoCompra } from "@/lib/fuelhub/types";

// GET /api/compras — listado/filtro (spec sección 3.1 / 8.1). El navegador llama esto, nunca
// FuelHub Cloud directo (regla de arquitectura, sección 2.2).
export async function GET(req: NextRequest) {
  return withSession(async () => {
    const sp = req.nextUrl.searchParams;
    const data = await listarCompras({
      estacionCodigo: sp.get("estacionCodigo") ?? undefined,
      fechaDesde: sp.get("fechaDesde") ?? undefined,
      fechaHasta: sp.get("fechaHasta") ?? undefined,
      estado: (sp.get("estado") as EstadoCompra | null) ?? undefined,
      productoId: sp.get("productoId") ?? undefined,
      categoria: (sp.get("categoria") as Categoria | null) ?? undefined,
      page: sp.get("page") ? Number(sp.get("page")) : undefined,
      pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
    });
    return NextResponse.json(data);
  });
}

// POST /api/compras — crear compra (sección 3.1).
export async function POST(req: NextRequest) {
  return withSession(async () => {
    const raw = (await req.json()) as Record<string, unknown>;
    // merma nunca es un campo de entrada (regla 4.4); costoTotal tampoco se manda al crear.
    const input = limpiarUpdateInput(raw) as unknown as CompraCreateInput;
    // codigoEstacion SÍ es requerido al crear (regla 4.7 solo lo congela después de creada).
    input.codigoEstacion = raw.codigoEstacion as string;
    const compra = await crearCompra(input);
    return NextResponse.json(compra, { status: 201 });
  });
}
