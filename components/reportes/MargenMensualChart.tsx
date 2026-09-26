"use client";

import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ESTACIONES } from "@/lib/fuelhub/types";
import type { ReporteMargenItem } from "@/lib/fuelhub/types";
import { CHART_GRID, colorEstacion } from "@/lib/chartPalette";
import { formatMoneda } from "@/lib/format";
import ReportCard from "./ReportCard";
import ChartTooltip from "./ChartTooltip";
import ChartLegend from "./ChartLegend";

const MESES = 6;

function ventanasMensuales(cantidad: number): { etiqueta: string; desde: string; hasta: string }[] {
  const hoy = new Date();
  const ventanas = [];
  for (let i = cantidad - 1; i >= 0; i--) {
    const inicio = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() - i, 1));
    const finExclusivo = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() - i + 1, 1));
    const fin = new Date(finExclusivo.getTime() - 86400000);
    ventanas.push({
      etiqueta: inicio.toLocaleDateString("es-PE", { month: "short", year: "2-digit", timeZone: "UTC" }),
      desde: inicio.toISOString().slice(0, 10),
      hasta: fin.toISOString().slice(0, 10),
    });
  }
  return ventanas;
}

// Idea #2: evolución del margen mes a mes, una línea por estación. /reportes/margen no acepta un
// rango con serie temporal — se repite la llamada una vez por mes (acotado a 6, no es el loop
// diario sin límite natural de la idea #4, que sí quedó marcada [GAP]).
export default function MargenMensualChart() {
  const [datos, setDatos] = useState<Record<string, ReporteMargenItem[]> | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(null);

    const ventanas = ventanasMensuales(MESES);
    Promise.all(
      ventanas.map((v) =>
        fetch(`/api/reportes/margen?${new URLSearchParams({ fechaDesde: v.desde, fechaHasta: v.hasta })}`).then(
          async (res) => {
            if (!res.ok) throw new Error("No se pudo cargar el margen mensual.");
            return (await res.json()) as ReporteMargenItem[];
          }
        )
      )
    )
      .then((resultados) => {
        if (cancelado) return;
        const porMes: Record<string, ReporteMargenItem[]> = {};
        resultados.forEach((r, i) => {
          const etiqueta = ventanas[i]?.etiqueta;
          if (etiqueta) porMes[etiqueta] = r;
        });
        setDatos(porMes);
      })
      .catch((err: unknown) => {
        if (!cancelado) setError(err instanceof Error ? err.message : "No se pudo cargar el margen mensual.");
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  const ventanas = ventanasMensuales(MESES);
  const data = ventanas.map((v) => {
    const fila: Record<string, number | string> = { mes: v.etiqueta };
    for (const e of ESTACIONES) {
      const item = datos?.[v.etiqueta]?.find((x) => x.estacion === e.codigo);
      fila[e.codigo] = item?.margenEstimado ?? 0;
    }
    return fila;
  });

  const hayDatos = Object.values(datos ?? {}).some((arr) => arr.length > 0);

  return (
    <ReportCard
      title="Evolución del margen mensual"
      description="Margen estimado por estación en los últimos 6 meses."
      cargando={cargando}
      error={error}
      vacio={!hayDatos}
    >
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ left: 8, right: 16 }}>
          <CartesianGrid vertical={false} stroke={CHART_GRID} />
          <XAxis dataKey="mes" stroke="#898781" fontSize={12} />
          <YAxis stroke="#898781" fontSize={12} tickFormatter={(v) => formatMoneda(v)} width={80} />
          <Tooltip content={<ChartTooltip formatValor={(v) => formatMoneda(Number(v))} />} />
          {ESTACIONES.map((e) => (
            <Line
              key={e.codigo}
              type="monotone"
              dataKey={e.codigo}
              name={e.nombre}
              stroke={colorEstacion(e.codigo)}
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2, stroke: "#fcfcfb", fill: colorEstacion(e.codigo) }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <ChartLegend items={ESTACIONES.map((e) => ({ label: e.nombre, color: colorEstacion(e.codigo) }))} />
    </ReportCard>
  );
}
