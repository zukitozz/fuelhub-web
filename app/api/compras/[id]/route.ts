import { NextRequest, NextResponse } from "next/server";
import { withSession } from "@/lib/apiRouteHelpers";
import { FuelHubApiError } from "@/lib/fuelhub/client";
import { actualizarCompra, limpiarUpdateInput, obtenerCompra } from "@/lib/fuelhub/compras";
import { canAnularCompra } from "@/lib/permissions";

// GET /api/compras/{id} — detalle con destinos[] (sección 3.1 / 8.2), precarga el form de edición.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  return withSession(async () => {
    const compra = await obtenerCompra(params.id);
    return NextResponse.json(compra);
  });
}

// PUT /api/compras/{id} — editar (PUT parcial, regla 4.6) o anular (sección 3.1).
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  return withSession(async (role) => {
    const raw = (await req.json()) as Record<string, unknown>;
    const input = limpiarUpdateInput(raw);

    if (input.estado === "ANULADO" && !canAnularCompra(role)) {
      throw new FuelHubApiError(403, {
        error: "NO_AUTORIZADO",
        message: "Tu rol no tiene permiso para anular compras.",
      });
    }

    const compra = await actualizarCompra(params.id, input);
    return NextResponse.json(compra);
  });
}
