"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { ESTACIONES } from "@/lib/fuelhub/types";
import Spinner from "./Spinner";

// Filtros del listado de compras (sección 3.1): estación, rango de fechas, estado, categoría.
// Estado por defecto es "Todos" (sin filtrar) — este listado es la fuente de verdad de compras
// sin importar en qué estado quedaron. Actualiza la URL para que el listado (server component)
// vuelva a pedir datos con los nuevos filtros.
export default function ComprasFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [navegando, startTransition] = useTransition();

  const [estacionCodigo, setEstacionCodigo] = useState(searchParams.get("estacionCodigo") ?? "");
  const [fechaDesde, setFechaDesde] = useState(searchParams.get("fechaDesde") ?? "");
  const [fechaHasta, setFechaHasta] = useState(searchParams.get("fechaHasta") ?? "");
  const [categoria, setCategoria] = useState(searchParams.get("categoria") ?? "");
  const [estado, setEstado] = useState(searchParams.get("estado") ?? "");

  // Solo importa en mobile (ver globals.css ".filters-panel"): en desktop el panel siempre está
  // visible sin importar este estado. Arranca cerrado y se vuelve a cerrar al aplicar, para no
  // perder espacio de la lista con los filtros a la vista todo el tiempo.
  const [panelAbierto, setPanelAbierto] = useState(false);
  const filtrosActivos = [estacionCodigo, fechaDesde, fechaHasta, categoria, estado].filter(Boolean).length;

  function aplicar() {
    const params = new URLSearchParams();
    if (estacionCodigo) params.set("estacionCodigo", estacionCodigo);
    if (fechaDesde) params.set("fechaDesde", fechaDesde);
    if (fechaHasta) params.set("fechaHasta", fechaHasta);
    if (categoria) params.set("categoria", categoria);
    if (estado) params.set("estado", estado);
    params.set("page", "1");
    setPanelAbierto(false);
    startTransition(() => router.push(`/compras?${params.toString()}`));
  }

  function limpiar() {
    setEstacionCodigo("");
    setFechaDesde("");
    setFechaHasta("");
    setCategoria("");
    setEstado("");
    setPanelAbierto(false);
    startTransition(() => router.push("/compras"));
  }

  return (
    <div>
      <button type="button" className="btn filters-toggle" onClick={() => setPanelAbierto((v) => !v)}>
        Filtros{filtrosActivos > 0 ? ` (${filtrosActivos})` : ""}
      </button>

      <div className={`filters-panel${panelAbierto ? " open" : ""}`}>
        <div className="field">
          <label>Estación</label>
          <select value={estacionCodigo} onChange={(e) => setEstacionCodigo(e.target.value)}>
            <option value="">Todas</option>
            {ESTACIONES.map((e) => (
              <option key={e.codigo} value={e.codigo}>
                {e.nombre}
              </option>
            ))}
          </select>
        </div>
        {/* TODO: "Desde"/"Hasta" hoy solo filtran por `fecha` (la del comprobante) — no hay forma
            de filtrar por `creadoEn` (fecha real de registro en el sistema), que puede ser muy
            distinta (ver CompraBase.creadoEn en lib/fuelhub/types.ts). FuelHub Cloud ignora en
            silencio cualquier parámetro de fecha que no sea fechaDesde/fechaHasta sobre `fecha`
            (confirmado 2026-09-26), así que esto requiere que fuelhub-core agregue soporte real
            (ej. creadoDesde/creadoHasta) antes de poder corregirlo acá. */}
        <div className="field">
          <label>Desde</label>
          <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
        </div>
        <div className="field">
          <label>Hasta</label>
          <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
        </div>
        <div className="field">
          <label>Categoría</label>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="">Todas</option>
            <option value="COMBUSTIBLE">Combustible</option>
            <option value="NO_COMBUSTIBLE">No combustible</option>
          </select>
        </div>
        <div className="field">
          <label>Estado</label>
          <select value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Todos</option>
            <option value="ACTIVO">Activo</option>
            <option value="ANULADO">Anulado</option>
            <option value="PENDIENTE_REVISION">Pendiente de revisión</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary" onClick={aplicar} disabled={navegando}>
            {navegando && <Spinner size={12} />}
            Filtrar
          </button>
          {filtrosActivos > 0 && (
            <button type="button" className="btn" onClick={limpiar} disabled={navegando}>
              Borrar filtros
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
