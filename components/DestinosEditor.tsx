"use client";

import { useEffect, useState } from "react";
import { ESTACIONES, type DestinoInput, type Tanque } from "@/lib/fuelhub/types";
import { formatCantidad } from "@/lib/format";
import Spinner from "./Spinner";

interface Props {
  destinos: DestinoInput[];
  onChange: (destinos: DestinoInput[]) => void;
  cantidadCompra: number;
  // false para mercadería fuera de catálogo (openapi.yaml: destinos vacío = "compra sin tanque
  // asociado, p. ej. mercadería") — ajusta solo el mensaje, agregar destinos sigue permitido.
  obligatorio?: boolean;
}

// Editor de destinos[] (spec sección 3.1, regla 4.3): el selector de tanque permite CUALQUIER
// estación, no solo la de la compra (caso de contingencia, sección 1). Por fila se elige primero
// la estación y luego el tanque de esa estación — pero solo tanqueId viaja en destinos[], la
// estación es únicamente un filtro local para no tener que buscar entre todos los tanques.
// Muestra en vivo la suma vs. cantidad y la merma preview — pero el valor final de merma y la
// validación real siempre los da el backend (nunca se envía merma en el body).
export default function DestinosEditor({ destinos, onChange, cantidadCompra, obligatorio = true }: Props) {
  const [tanques, setTanques] = useState<Tanque[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filaEstacion, setFilaEstacion] = useState<string[]>(() => destinos.map(() => ""));

  useEffect(() => {
    let cancelado = false;
    fetch("/api/tanques")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Tanque[]) => {
        if (!cancelado) setTanques(data);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  // Modo editar: destinos[] ya trae tanqueId — deriva la estación de cada fila una vez que
  // cargan los tanques, para que el selector de estación aparezca preseleccionado.
  useEffect(() => {
    if (cargando) return;
    setFilaEstacion((prev) =>
      destinos.map((d, i) => prev[i] || tanques.find((t) => t.id === d.tanqueId)?.codigoEstacion || "")
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargando, tanques]);

  // No todas las estaciones con tanques están necesariamente en el catálogo fijo ESTACIONES
  // (p.ej. estaciones de prueba) — la lista de opciones sale de los tanques reales.
  const estacionesDisponibles = Array.from(new Set(tanques.map((t) => t.codigoEstacion))).sort();

  const suma = destinos.reduce((acc, d) => acc + (Number(d.cantidad) || 0), 0);
  const mermaPreview = cantidadCompra - suma;
  const excedeCantidad = suma > cantidadCompra;

  function nombreEstacion(codigo: string): string {
    return ESTACIONES.find((e) => e.codigo === codigo)?.nombre ?? codigo;
  }

  function actualizarFila(index: number, cambios: Partial<DestinoInput>) {
    const nuevos = destinos.map((d, i) => (i === index ? { ...d, ...cambios } : d));
    onChange(nuevos);
  }

  function actualizarEstacionFila(index: number, codigoEstacion: string) {
    setFilaEstacion((prev) => prev.map((e, i) => (i === index ? codigoEstacion : e)));
    // Cambiar de estación invalida el tanque elegido antes — puede no existir en la nueva.
    actualizarFila(index, { tanqueId: "" });
  }

  function agregarFila() {
    setFilaEstacion((prev) => [...prev, ""]);
    onChange([...destinos, { tanqueId: "", cantidad: 0 }]);
  }

  function quitarFila(index: number) {
    setFilaEstacion((prev) => prev.filter((_, i) => i !== index));
    onChange(destinos.filter((_, i) => i !== index));
  }

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 12, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <strong style={{ display: "flex", alignItems: "center", gap: 8 }}>
          Destinos (reparto a tanques)
          {cargando && <Spinner size={12} />}
        </strong>
        <button type="button" className="btn" onClick={agregarFila} disabled={cargando}>
          + Agregar destino
        </button>
      </div>

      {destinos.length === 0 && (
        <p style={{ color: "var(--text-muted)" }}>
          {obligatorio
            ? "Sin destinos todavía — agrega al menos uno."
            : "Sin destinos — opcional para mercadería (no va a un tanque)."}
        </p>
      )}

      {destinos.map((d, i) => {
        const codigoEstacionFila = filaEstacion[i] ?? "";
        const tanquesDeEstacion = tanques.filter((t) => t.codigoEstacion === codigoEstacionFila);

        return (
          <div
            key={i}
            style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 6 }}
          >
            <select
              value={codigoEstacionFila}
              onChange={(e) => actualizarEstacionFila(i, e.target.value)}
              style={{ flex: "1 1 160px", padding: 6, border: "1px solid var(--border)", borderRadius: 6 }}
              disabled={cargando}
            >
              <option value="">{cargando ? "Cargando…" : "Selecciona una estación"}</option>
              {estacionesDisponibles.map((codigo) => (
                <option key={codigo} value={codigo}>
                  {nombreEstacion(codigo)}
                </option>
              ))}
            </select>
            <select
              value={d.tanqueId}
              onChange={(e) => actualizarFila(i, { tanqueId: e.target.value })}
              style={{ flex: "1 1 160px", padding: 6, border: "1px solid var(--border)", borderRadius: 6 }}
              disabled={cargando || !codigoEstacionFila}
            >
              <option value="">
                {codigoEstacionFila ? "Selecciona un tanque" : "Elige una estación primero"}
              </option>
              {tanquesDeEstacion.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre ?? t.id}
                </option>
              ))}
            </select>
            <input
              type="number"
              step="0.001"
              min={0}
              value={d.cantidad}
              onChange={(e) => actualizarFila(i, { cantidad: Number(e.target.value) })}
              style={{ flex: "1 1 100px", padding: 6, border: "1px solid var(--border)", borderRadius: 6 }}
            />
            <button type="button" className="btn btn-danger" onClick={() => quitarFila(i)}>
              Quitar
            </button>
          </div>
        );
      })}

      <div style={{ marginTop: 8, fontSize: 13 }}>
        <div>
          Suma destinos: <strong>{formatCantidad(suma)}</strong> / Cantidad comprada:{" "}
          <strong>{formatCantidad(cantidadCompra)}</strong>
        </div>
        <div className={excedeCantidad ? "merma-alerta" : undefined}>
          Merma estimada: {formatCantidad(Math.max(mermaPreview, 0))}
          {excedeCantidad && " — no puedes repartir más de lo comprado"}
        </div>
      </div>
    </div>
  );
}
