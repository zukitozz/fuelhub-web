"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ProveedorAgregado } from "@/lib/reportesAgregados";
import { useReporte } from "@/lib/useReporte";
import { haceDiasISO, hoyISO } from "@/lib/dateRanges";
import { CHART_GRID, CHART_SEQUENTIAL } from "@/lib/chartPalette";
import { formatMoneda } from "@/lib/format";
import ReportCard from "./ReportCard";
import ChartTooltip from "./ChartTooltip";
import RangoFechasControl from "./RangoFechasControl";

const MAX_BARRAS = 8;

// Idea #7: distribución de compras por proveedor en un período. Ranking de magnitud -> un solo
// hue; si hay más de 8 proveedores, el resto se pliega en "Otros" y la tabla de abajo conserva
// el detalle completo (relief rule).
export default function ComprasPorProveedorChart() {
  const [desde, setDesde] = useState(haceDiasISO(90));
  const [hasta, setHasta] = useState(hoyISO());

  const url = `/api/reportes/proveedores?${new URLSearchParams({ fechaDesde: desde, fechaHasta: hasta })}`;
  const { datos, cargando, error } = useReporte<ProveedorAgregado[]>(url);

  const ordenados = [...(datos ?? [])].sort((a, b) => b.costoTotal - a.costoTotal);
  const top = ordenados.slice(0, MAX_BARRAS);
  const restoTotal = ordenados.slice(MAX_BARRAS).reduce((acc, p) => acc + p.costoTotal, 0);
  const restoCantidad = ordenados.slice(MAX_BARRAS).reduce((acc, p) => acc + p.cantidadCompras, 0);
  const data =
    restoTotal > 0
      ? [...top, { proveedor: "Otros", costoTotal: restoTotal, cantidadCompras: restoCantidad }]
      : top;

  return (
    <ReportCard
      title="Compras por proveedor"
      description="Solo compras activas — proveedores con mayor gasto total en el período."
      cargando={cargando}
      error={error}
      vacio={data.length === 0}
      controles={<RangoFechasControl desde={desde} hasta={hasta} onDesde={setDesde} onHasta={setHasta} />}
    >
      <ResponsiveContainer width="100%" height={Math.max(160, data.length * 36)}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 48 }}>
          <CartesianGrid horizontal={false} stroke={CHART_GRID} />
          <XAxis type="number" tickFormatter={(v) => formatMoneda(v)} stroke="#898781" fontSize={12} />
          <YAxis type="category" dataKey="proveedor" stroke="#898781" fontSize={12} width={120} />
          <Tooltip content={<ChartTooltip formatValor={(v) => formatMoneda(Number(v))} />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
          <Bar dataKey="costoTotal" name="Costo total" fill={CHART_SEQUENTIAL} radius={[0, 4, 4, 0]} maxBarSize={20}>
            <LabelList dataKey="costoTotal" position="right" formatter={(v) => formatMoneda(Number(v))} fill="#0b0b0b" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Proveedor</th>
              <th>Costo total</th>
              <th>N° de compras</th>
            </tr>
          </thead>
          <tbody>
            {ordenados.map((p) => (
              <tr key={p.proveedor}>
                <td>{p.proveedor}</td>
                <td>{formatMoneda(p.costoTotal)}</td>
                <td>{p.cantidadCompras}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ReportCard>
  );
}
