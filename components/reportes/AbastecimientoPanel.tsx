"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ReporteAbastecimientoItem } from "@/lib/fuelhub/types";
import { useReporte } from "@/lib/useReporte";
import { CHART_GRID, CHART_SERIES, CHART_STATUS } from "@/lib/chartPalette";
import { formatCantidad } from "@/lib/format";
import ReportCard from "./ReportCard";
import ChartTooltip from "./ChartTooltip";
import ChartLegend from "./ChartLegend";

// Ideas #5 (tabla + semáforo) y #6 (barras comparativas de 2 métricas) — mismo endpoint y mismo
// widget porque cuentan la misma historia: qué tanque está en riesgo y por qué.
export default function AbastecimientoPanel() {
  const { datos, cargando, error } = useReporte<ReporteAbastecimientoItem[]>("/api/reportes/abastecimiento");

  const items = datos ?? [];
  const comparables = items
    .filter((i) => i.diasDeAutonomiaEstimados !== null && i.frecuenciaRealDias !== null)
    .map((i) => ({
      etiqueta: `${i.estacion} · ${i.producto}`,
      autonomia: i.diasDeAutonomiaEstimados as number,
      frecuencia: i.frecuenciaRealDias as number,
    }));

  return (
    <ReportCard
      title="Abastecimiento de tanques"
      description="Autonomía estimada vs. frecuencia real de reabastecimiento — ordenado por más urgente."
      cargando={cargando}
      error={error}
      vacio={items.length === 0}
      fullWidth
    >
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Estación</th>
              <th>Tanque</th>
              <th>Autonomía (días)</th>
              <th>Frecuencia real (días)</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={`${i.estacion}-${i.tanque}`}>
                <td>{i.estacion}</td>
                <td>{i.tanque}</td>
                <td>{i.diasDeAutonomiaEstimados === null ? "—" : formatCantidad(i.diasDeAutonomiaEstimados)}</td>
                <td>{i.frecuenciaRealDias === null ? "—" : formatCantidad(i.frecuenciaRealDias)}</td>
                <td>
                  <span className="status-tag">
                    <span
                      className="status-tag-dot"
                      style={{ background: i.enRiesgo ? CHART_STATUS.critical : CHART_STATUS.good }}
                    />
                    {i.enRiesgo ? "En riesgo" : "OK"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {comparables.length > 0 && (
        <>
          <ResponsiveContainer width="100%" height={Math.max(200, comparables.length * 36)}>
            <BarChart data={comparables} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid horizontal={false} stroke={CHART_GRID} />
              <XAxis type="number" stroke="#898781" fontSize={12} />
              <YAxis type="category" dataKey="etiqueta" stroke="#898781" fontSize={11} width={140} />
              <Tooltip content={<ChartTooltip formatValor={(v) => `${formatCantidad(Number(v))} días`} />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
              <Bar dataKey="autonomia" name="Autonomía estimada" fill={CHART_SERIES[0]} radius={[0, 4, 4, 0]} maxBarSize={16} />
              <Bar dataKey="frecuencia" name="Frecuencia real" fill={CHART_SERIES[1]} radius={[0, 4, 4, 0]} maxBarSize={16} />
            </BarChart>
          </ResponsiveContainer>
          <ChartLegend
            items={[
              { label: "Autonomía estimada", color: CHART_SERIES[0] },
              { label: "Frecuencia real", color: CHART_SERIES[1] },
            ]}
          />
        </>
      )}
    </ReportCard>
  );
}
