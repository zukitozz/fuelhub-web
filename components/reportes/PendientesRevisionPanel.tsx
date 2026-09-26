"use client";

import Link from "next/link";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PendientesPorEstacion } from "@/lib/reportesAgregados";
import { useReporte } from "@/lib/useReporte";
import { CHART_GRID, CHART_SEQUENTIAL } from "@/lib/chartPalette";
import ReportCard from "./ReportCard";
import ChartTooltip from "./ChartTooltip";

// Idea #9: compras que el Lambda de lectura de correos no pudo matchear contra el catálogo,
// acumuladas por estación. Es una bandeja de control de calidad, no solo un gráfico — por eso
// lleva un link directo al listado filtrado.
export default function PendientesRevisionPanel() {
  const { datos, cargando, error } = useReporte<PendientesPorEstacion[]>("/api/reportes/pendientes-revision");

  const data = datos ?? [];
  const total = data.reduce((acc, d) => acc + d.cantidad, 0);

  return (
    <ReportCard
      title="Compras pendientes de revisión"
      description="El Lambda de lectura de correos no pudo matchearlas contra el catálogo."
      cargando={cargando}
      error={error}
      vacio={total === 0}
      mensajeVacio="No hay compras pendientes de revisión."
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 28, fontWeight: 600 }}>{total}</span>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>en total</span>
        <Link href="/compras?estado=PENDIENTE_REVISION" className="btn" style={{ marginLeft: "auto" }}>
          Ver listado
        </Link>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 16 }}>
          <CartesianGrid vertical={false} stroke={CHART_GRID} />
          <XAxis dataKey="estacion" stroke="#898781" fontSize={12} />
          <YAxis allowDecimals={false} stroke="#898781" fontSize={12} width={30} />
          <Tooltip content={<ChartTooltip formatValor={(v) => String(v)} />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
          <Bar dataKey="cantidad" name="Pendientes" fill={CHART_SEQUENTIAL} radius={[4, 4, 0, 0]} maxBarSize={24}>
            <LabelList dataKey="cantidad" position="top" fill="#0b0b0b" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ReportCard>
  );
}
