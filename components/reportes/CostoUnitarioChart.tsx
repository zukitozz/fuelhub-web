"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CATALOGO_PRODUCTOS_PLACEHOLDER } from "@/lib/fuelhub/types";
import type { CostoUnitarioPunto } from "@/lib/reportesAgregados";
import { useReporte } from "@/lib/useReporte";
import { haceDiasISO, hoyISO } from "@/lib/dateRanges";
import { CHART_GRID, CHART_SERIES } from "@/lib/chartPalette";
import { formatFechaNegocio, formatMoneda } from "@/lib/format";
import ReportCard from "./ReportCard";
import ChartTooltip from "./ChartTooltip";
import ChartLegend from "./ChartLegend";

// Idea #8: evolución del costo unitario de un producto en el tiempo, una línea por proveedor
// (para detectar si un proveedor específico está subiendo precios).
//
// TODO: el selector usa CATALOGO_PRODUCTOS_PLACEHOLDER (mismo placeholder que CompraForm, ver
// lib/fuelhub/types.ts) — sus productoId son inventados, no calzan con productos_maestro real.
// Reemplazar junto con el resto del catálogo cuando esté disponible (README punto 3).
export default function CostoUnitarioChart() {
  const [productoId, setProductoId] = useState(CATALOGO_PRODUCTOS_PLACEHOLDER[0]?.id ?? "");
  const [desde, setDesde] = useState(haceDiasISO(180));
  const [hasta, setHasta] = useState(hoyISO());

  const url = `/api/reportes/costo-unitario?${new URLSearchParams({ productoId, fechaDesde: desde, fechaHasta: hasta })}`;
  const { datos, cargando, error } = useReporte<CostoUnitarioPunto[]>(url);

  const proveedores = useMemo(
    () => [...new Set((datos ?? []).map((p) => p.proveedor))].sort((a, b) => a.localeCompare(b)),
    [datos]
  );
  const colorPorProveedor = useMemo(
    () => new Map(proveedores.map((p, i) => [p, CHART_SERIES[i % CHART_SERIES.length]])),
    [proveedores]
  );

  // recharts necesita una fila por fecha con una columna por proveedor (undefined = sin punto
  // ese día para ese proveedor).
  const fechas = [...new Set((datos ?? []).map((p) => p.fecha))].sort((a, b) => a.localeCompare(b));
  const data = fechas.map((fecha) => {
    const fila: Record<string, number | string> = { fecha: formatFechaNegocio(fecha) };
    for (const p of datos ?? []) {
      if (p.fecha === fecha) fila[p.proveedor] = p.costoUnitario;
    }
    return fila;
  });

  return (
    <ReportCard
      title="Evolución de costo unitario"
      description="Detecta subidas de precio de un proveedor en el tiempo."
      cargando={cargando}
      error={error}
      vacio={data.length === 0}
      mensajeVacio="Sin compras activas de este producto en el rango."
      controles={
        <>
          <select value={productoId} onChange={(e) => setProductoId(e.target.value)} aria-label="Producto">
            {CATALOGO_PRODUCTOS_PLACEHOLDER.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} aria-label="Desde" />
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} aria-label="Hasta" />
        </>
      }
    >
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ left: 8, right: 16 }}>
          <CartesianGrid vertical={false} stroke={CHART_GRID} />
          <XAxis dataKey="fecha" stroke="#898781" fontSize={12} />
          <YAxis stroke="#898781" fontSize={12} tickFormatter={(v) => formatMoneda(v)} width={80} />
          <Tooltip content={<ChartTooltip formatValor={(v) => formatMoneda(Number(v))} />} />
          {proveedores.map((prov) => (
            <Line
              key={prov}
              type="monotone"
              dataKey={prov}
              name={prov}
              stroke={colorPorProveedor.get(prov)}
              strokeWidth={2}
              connectNulls
              dot={{ r: 4, strokeWidth: 2, stroke: "#fcfcfb", fill: colorPorProveedor.get(prov) }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <ChartLegend items={proveedores.map((p) => ({ label: p, color: colorPorProveedor.get(p) ?? CHART_SERIES[0] }))} />
    </ReportCard>
  );
}
