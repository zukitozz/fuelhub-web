"use client";

import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ESTACIONES } from "@/lib/fuelhub/types";
import type { ReporteDia } from "@/lib/fuelhub/types";
import { useReporte } from "@/lib/useReporte";
import { hoyISO } from "@/lib/dateRanges";
import { CHART_SERIES } from "@/lib/chartPalette";
import { formatCantidad, formatMoneda } from "@/lib/format";
import ReportCard from "./ReportCard";
import ChartTooltip from "./ChartTooltip";
import ChartLegend from "./ChartLegend";

type FiltroCategoria = "TODOS" | "COMBUSTIBLE" | "NO_COMBUSTIBLE";

const MAX_SLICES = 7; // más de ~7 clases -> plegar en "Otros" (choosing-a-form.md)

// Gráfico #1 (pedido explícito, spec sección 6): ventas por producto de un día/estación puntual.
export default function VentasPastelChart() {
  const [fecha, setFecha] = useState(hoyISO());
  const [estacionCodigo, setEstacionCodigo] = useState<string>(ESTACIONES[0].codigo);
  const [filtroCategoria, setFiltroCategoria] = useState<FiltroCategoria>("TODOS");
  const [enGalones, setEnGalones] = useState(false);

  const url = `/api/reportes/dia?${new URLSearchParams({ fechaNegocio: fecha, estacionCodigo })}`;
  const { datos: reporte, cargando, error } = useReporte<ReporteDia>(url);

  // Color estable por producto calculado sobre la lista COMPLETA (sin filtrar) — así, cambiar el
  // filtro de categoría no le cambia el color a los productos que sobreviven al filtro (regla:
  // "el color sigue a la entidad, nunca a su posición/filtro").
  const colorPorProducto = useMemo(() => {
    const nombres = [...new Set((reporte?.productos ?? []).map((p) => p.producto))].sort((a, b) => a.localeCompare(b));
    return new Map(nombres.map((nombre, i) => [nombre, CHART_SERIES[i % CHART_SERIES.length]]));
  }, [reporte]);

  const usaGalones = enGalones && filtroCategoria === "COMBUSTIBLE";

  const filtrados = (reporte?.productos ?? []).filter((p) => {
    if (filtroCategoria === "TODOS") return true;
    if (filtroCategoria === "COMBUSTIBLE") return p.categoria === "COMBUSTIBLE";
    return p.categoria === "NO_COMBUSTIBLE" || p.categoria === null;
  });

  const conValor = filtrados
    .map((p) => ({
      nombre: p.categoria === null ? `${p.producto} (sin clasificar)` : p.producto,
      color: colorPorProducto.get(p.producto) ?? CHART_SERIES[0],
      valor: usaGalones ? p.cantidadVendida : p.ingresos,
    }))
    .sort((a, b) => b.valor - a.valor);

  const top = conValor.slice(0, MAX_SLICES);
  const restoValor = conValor.slice(MAX_SLICES).reduce((acc, p) => acc + p.valor, 0);
  const data = restoValor > 0 ? [...top, { nombre: "Otros", color: "#898781", valor: restoValor }] : top;

  const formatValor = (v: number | string) => (usaGalones ? `${formatCantidad(Number(v))} gal` : formatMoneda(Number(v)));

  return (
    <ReportCard
      title="Ventas por producto"
      description="Pastel de un día y estación puntual — filtra por categoría."
      cargando={cargando}
      error={error}
      vacio={!reporte || data.length === 0}
      mensajeVacio="No hay cierre de día registrado para esta fecha/estación."
      fullWidth
      controles={
        <>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} aria-label="Fecha" />
          <select value={estacionCodigo} onChange={(e) => setEstacionCodigo(e.target.value)} aria-label="Estación">
            {ESTACIONES.map((e) => (
              <option key={e.codigo} value={e.codigo}>
                {e.nombre}
              </option>
            ))}
          </select>
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value as FiltroCategoria)}
            aria-label="Categoría"
          >
            <option value="TODOS">Todos</option>
            <option value="COMBUSTIBLE">Combustible</option>
            <option value="NO_COMBUSTIBLE">No combustible</option>
          </select>
          {filtroCategoria === "COMBUSTIBLE" && (
            <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
              <input type="checkbox" checked={enGalones} onChange={(e) => setEnGalones(e.target.checked)} />
              Galones
            </label>
          )}
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={data} dataKey="valor" nameKey="nombre" innerRadius={50} outerRadius={90} paddingAngle={2}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="#fcfcfb" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip formatValor={formatValor} />} />
          </PieChart>
        </ResponsiveContainer>
        <ChartLegend items={data.map((d) => ({ label: d.nombre, color: d.color }))} />
        {reporte && reporte.totalSinClasificar > 0 && filtroCategoria === "TODOS" && (
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
            Incluye {formatMoneda(reporte.totalSinClasificar)} sin clasificar al registrar el cierre.
          </p>
        )}
      </div>
    </ReportCard>
  );
}
