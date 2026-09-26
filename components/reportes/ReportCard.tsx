"use client";

import type { ReactNode } from "react";
import Spinner from "../Spinner";
import ErrorBanner from "../ErrorBanner";

// Contenedor común para cada widget de /reportes: título + descripción + controles propios, y
// los 3 estados que todo reporte puede tener (cargando/error/vacío) resueltos en un solo lugar
// en vez de repetirlos en cada gráfico.
export default function ReportCard({
  title,
  description,
  cargando,
  error,
  vacio,
  mensajeVacio = "Sin datos para este filtro.",
  controles,
  children,
  fullWidth,
}: {
  title: string;
  description?: string;
  cargando: boolean;
  error: string | null;
  vacio?: boolean;
  mensajeVacio?: string;
  controles?: ReactNode;
  children: ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <section className={`report-card${fullWidth ? " full-width" : ""}`}>
      <div className="report-card-header">
        <div>
          <h2>{title}</h2>
          {description && <p className="report-card-desc">{description}</p>}
        </div>
        {controles && <div className="report-card-controls">{controles}</div>}
      </div>
      <div className="report-card-body">
        {cargando ? (
          <div className="report-card-loading">
            <Spinner size={22} />
          </div>
        ) : error ? (
          <ErrorBanner error={error} />
        ) : vacio ? (
          <p className="empty-mobile">{mensajeVacio}</p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
