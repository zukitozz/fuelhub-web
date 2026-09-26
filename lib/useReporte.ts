"use client";

import { useEffect, useState } from "react";

interface EstadoReporte<T> {
  datos: T | null;
  cargando: boolean;
  error: string | null;
}

/** Fetch de un endpoint de reporte propio (/api/reportes/**) desde un componente cliente — nunca
 * FuelHub Cloud directo (regla 2.2). `url === null` deja el hook inactivo (ej. falta un filtro
 * obligatorio como productoId). Un 404 no es error: algunos reportes (ej. /reportes/dia) lo usan
 * para "no hay datos para este filtro" — se resuelve como `datos: null` sin pasar por `error`. */
export function useReporte<T>(url: string | null): EstadoReporte<T> {
  const [datos, setDatos] = useState<T | null>(null);
  const [cargando, setCargando] = useState(Boolean(url));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setDatos(null);
      setCargando(false);
      setError(null);
      return;
    }

    let cancelado = false;
    setCargando(true);
    setError(null);

    fetch(url)
      .then(async (res) => {
        if (res.status === 404) return null;
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.message ?? `No se pudo cargar el reporte (HTTP ${res.status}).`);
        }
        return (await res.json()) as T;
      })
      .then((data) => {
        if (!cancelado) setDatos(data);
      })
      .catch((err: unknown) => {
        if (!cancelado) setError(err instanceof Error ? err.message : "No se pudo cargar el reporte.");
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [url]);

  return { datos, cargando, error };
}
