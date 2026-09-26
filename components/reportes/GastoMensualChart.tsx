"use client";

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ESTACIONES } from "@/lib/fuelhub/types";
import type { GastoMensualPunto } from "@/lib/reportesAgregados";
import { useReporte } from "@/lib/useReporte";
import { CHART_GRID, colorEstacion } from "@/lib/chartPalette";
import { formatMoneda } from "@/lib/format";
import ReportCard from "./ReportCard";
import ChartTooltip from "./ChartTooltip";
import ChartLegend from "./ChartLegend";

// Gasto mensual en compras, total y por estación — barra apilada: la altura total de cada barra
// ES el total de todas las estaciones, y cada segmento es una estación (part-to-whole ->
// choosing-a-form.md). Últimos 6 meses por defecto (ver /api/reportes/gasto-mensual).
export default function GastoMensualChart() {
  const { datos, cargando, error } = useReporte<GastoMensualPunto[]>("/api/reportes/gasto-mensual");

  const data = (datos ?? []).map((p) => ({
    mes: p.mes,
    total: p.total,
    ...Object.fromEntries(ESTACIONES.map((e) => [e.codigo, p.porEstacion[e.codigo] ?? 0])),
  }));

  const hayDatos = data.some((d) => d.total > 0);

  return (
    <ReportCard
      title="Gasto mensual en compras"
      description="Total y desglose por estación, solo compras activas — últimos 6 meses."
      cargando={cargando}
      error={error}
      vacio={!hayDatos}
      mensajeVacio="No hay compras activas registradas en los últimos 6 meses."
    >
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 20 }}>
          <CartesianGrid vertical={false} stroke={CHART_GRID} />
          <XAxis dataKey="mes" stroke="#898781" fontSize={12} />
          <YAxis stroke="#898781" fontSize={12} tickFormatter={(v) => formatMoneda(v)} width={80} />
          <Tooltip content={<ChartTooltip formatValor={(v) => formatMoneda(Number(v))} />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
          {ESTACIONES.map((e, i) => (
            <Bar
              key={e.codigo}
              dataKey={e.codigo}
              name={e.nombre}
              stackId="gasto"
              fill={colorEstacion(e.codigo)}
              maxBarSize={40}
              radius={i === ESTACIONES.length - 1 ? [4, 4, 0, 0] : undefined}
            >
              {i === ESTACIONES.length - 1 && (
                <LabelList
                  dataKey="total"
                  position="top"
                  formatter={(v) => formatMoneda(Number(v))}
                  fill="#0b0b0b"
                  fontSize={11}
                />
              )}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
      <ChartLegend items={ESTACIONES.map((e) => ({ label: e.nombre, color: colorEstacion(e.codigo) }))} />
    </ReportCard>
  );
}
