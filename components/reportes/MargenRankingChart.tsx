"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ReporteMargenItem } from "@/lib/fuelhub/types";
import { useReporte } from "@/lib/useReporte";
import { haceDiasISO, hoyISO } from "@/lib/dateRanges";
import { CHART_GRID, CHART_SEQUENTIAL } from "@/lib/chartPalette";
import { formatMoneda } from "@/lib/format";
import ReportCard from "./ReportCard";
import ChartTooltip from "./ChartTooltip";
import RangoFechasControl from "./RangoFechasControl";

// Idea #1: ranking de margen estimado por estación en un período. Es magnitud de una sola
// métrica -> un solo hue (secuencial), no un color por estación (choosing-a-form.md).
export default function MargenRankingChart() {
  const [desde, setDesde] = useState(haceDiasISO(30));
  const [hasta, setHasta] = useState(hoyISO());

  const url = `/api/reportes/margen?${new URLSearchParams({ fechaDesde: desde, fechaHasta: hasta })}`;
  const { datos, cargando, error } = useReporte<ReporteMargenItem[]>(url);

  const data = [...(datos ?? [])].sort((a, b) => b.margenEstimado - a.margenEstimado);

  return (
    <ReportCard
      title="Ranking de margen por estación"
      description="Margen estimado (ingresos − costo de ventas) en el período."
      cargando={cargando}
      error={error}
      vacio={data.length === 0}
      controles={<RangoFechasControl desde={desde} hasta={hasta} onDesde={setDesde} onHasta={setHasta} />}
    >
      <ResponsiveContainer width="100%" height={Math.max(160, data.length * 40)}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 32 }}>
          <CartesianGrid horizontal={false} stroke={CHART_GRID} />
          <XAxis type="number" tickFormatter={(v) => formatMoneda(v)} stroke="#898781" fontSize={12} />
          <YAxis type="category" dataKey="estacion" stroke="#898781" fontSize={12} width={90} />
          <Tooltip content={<ChartTooltip formatValor={(v) => formatMoneda(Number(v))} />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
          <Bar dataKey="margenEstimado" name="Margen estimado" fill={CHART_SEQUENTIAL} radius={[0, 4, 4, 0]} maxBarSize={24}>
            <LabelList dataKey="margenEstimado" position="right" formatter={(v) => formatMoneda(Number(v))} fill="#0b0b0b" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ReportCard>
  );
}
