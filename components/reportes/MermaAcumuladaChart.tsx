"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MermaPorEstacion } from "@/lib/reportesAgregados";
import { useReporte } from "@/lib/useReporte";
import { haceDiasISO, hoyISO } from "@/lib/dateRanges";
import { CHART_GRID, CHART_SEQUENTIAL } from "@/lib/chartPalette";
import { formatCantidad } from "@/lib/format";
import ReportCard from "./ReportCard";
import ChartTooltip from "./ChartTooltip";
import RangoFechasControl from "./RangoFechasControl";

// Idea #11: merma acumulada por estación en un período. Solo ACTIVO y solo compras con destino
// registrado (merma null se ignora, no es cero) — ver /api/reportes/merma.
export default function MermaAcumuladaChart() {
  const [desde, setDesde] = useState(haceDiasISO(90));
  const [hasta, setHasta] = useState(hoyISO());

  const url = `/api/reportes/merma?${new URLSearchParams({ fechaDesde: desde, fechaHasta: hasta })}`;
  const { datos, cargando, error } = useReporte<MermaPorEstacion[]>(url);

  const data = datos ?? [];
  const hayDatos = data.some((d) => d.merma !== 0);

  return (
    <ReportCard
      title="Merma acumulada por estación"
      description="Solo compras activas con destino/tanque ya registrado."
      cargando={cargando}
      error={error}
      vacio={!hayDatos}
      controles={<RangoFechasControl desde={desde} hasta={hasta} onDesde={setDesde} onHasta={setHasta} />}
    >
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 16 }}>
          <CartesianGrid vertical={false} stroke={CHART_GRID} />
          <XAxis dataKey="estacion" stroke="#898781" fontSize={12} />
          <YAxis stroke="#898781" fontSize={12} tickFormatter={(v) => formatCantidad(v)} width={70} />
          <Tooltip content={<ChartTooltip formatValor={(v) => `${formatCantidad(Number(v))} gal`} />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
          <Bar dataKey="merma" name="Merma" fill={CHART_SEQUENTIAL} radius={[4, 4, 0, 0]} maxBarSize={24}>
            <LabelList dataKey="merma" position="top" formatter={(v) => formatCantidad(Number(v))} fill="#0b0b0b" fontSize={11} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ReportCard>
  );
}
