import { NextRequest, NextResponse } from "next/server";
import { withSession } from "@/lib/apiRouteHelpers";
import { listarTanques } from "@/lib/fuelhub/compras";

// GET /api/tanques — selector de tanque al armar destinos[] de una compra (sección 3.1).
// Sin estacionCodigo, con el token de back-office (station_scope=*) trae TODAS las estaciones —
// necesario para el caso de contingencia (compra facturada a una estación, repartida a otra).
export async function GET(req: NextRequest) {
  return withSession(async () => {
    const estacionCodigo = req.nextUrl.searchParams.get("estacionCodigo") ?? undefined;
    const tanques = await listarTanques(estacionCodigo);
    return NextResponse.json(tanques);
  });
}
