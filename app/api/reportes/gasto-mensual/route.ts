import { NextRequest, NextResponse } from "next/server";
import { withSession } from "@/lib/apiRouteHelpers";
import { listarTodasLasCompras } from "@/lib/fuelhub/compras";
import { ESTACIONES } from "@/lib/fuelhub/types";
import type { GastoMensualPunto } from "@/lib/reportesAgregados";

function rangoPorDefecto(): { desde: string; hasta: string } {
  const hoy = new Date();
  const hasta = hoy.toISOString().slice(0, 10);
  const desde = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() - 5, 1))
    .toISOString()
    .slice(0, 10);
  return { desde, hasta };
}

function mesesEnRango(desde: string, hasta: string): string[] {
  const [anioDesdeStr, mesDesdeStr] = desde.slice(0, 7).split("-");
  const [anioHastaStr, mesHastaStr] = hasta.slice(0, 7).split("-");
  const anioDesde = Number(anioDesdeStr);
  const mesDesde = Number(mesDesdeStr);
  const anioHasta = Number(anioHastaStr);
  const mesHasta = Number(mesHastaStr);
  const meses: string[] = [];
  let anio = anioDesde;
  let mes = mesDesde;
  while (anio < anioHasta || (anio === anioHasta && mes <= mesHasta)) {
    meses.push(`${anio}-${String(mes).padStart(2, "0")}`);
    mes += 1;
    if (mes > 12) {
      mes = 1;
      anio += 1;
    }
  }
  return meses;
}

// GET /api/reportes/gasto-mensual — gasto en compras (costoTotal, solo ACTIVO) por mes, total y
// desglosado por estación. Sin fechaDesde/fechaHasta usa los últimos 6 meses. No está en
// spec-agente-reportes-fuelhub.md (se agregó a pedido explícito) pero se construye con el mismo
// patrón sin-gap-de-backend que /api/reportes/proveedores y /api/reportes/merma: agregando GET
// /compras en el servidor, nunca en el navegador (regla 2.2).
export async function GET(req: NextRequest) {
  return withSession(async () => {
    const sp = req.nextUrl.searchParams;
    const porDefecto = rangoPorDefecto();
    const fechaDesde = sp.get("fechaDesde") ?? porDefecto.desde;
    const fechaHasta = sp.get("fechaHasta") ?? porDefecto.hasta;

    const compras = await listarTodasLasCompras({ estado: "ACTIVO", fechaDesde, fechaHasta });
    const reales = compras.filter((c) => ESTACIONES.some((e) => e.codigo === c.codigoEstacion));

    const acumulado = new Map<string, Record<string, number>>();
    for (const c of reales) {
      const mes = c.fecha.split(/[ T]/)[0]?.slice(0, 7);
      if (!mes) continue;
      const porEstacion = acumulado.get(mes) ?? {};
      porEstacion[c.codigoEstacion] = (porEstacion[c.codigoEstacion] ?? 0) + c.costoTotal;
      acumulado.set(mes, porEstacion);
    }

    const resultado: GastoMensualPunto[] = mesesEnRango(fechaDesde, fechaHasta).map((mes) => {
      const porEstacion = acumulado.get(mes) ?? {};
      const total = Object.values(porEstacion).reduce((acc, v) => acc + v, 0);
      return { mes, total, porEstacion };
    });

    return NextResponse.json(resultado);
  });
}
