"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CompraResumen } from "@/lib/fuelhub/types";
import {
  formatCantidad,
  formatFechaCorta,
  formatFechaNegocio,
  formatFechaRegistro,
  formatMoneda,
} from "@/lib/format";
import { ESTADO_LABELS } from "@/lib/estado";
import EstadoDot from "./EstadoDot";
import AnularCompraButton from "./AnularCompraButton";

// Tarjeta compacta para el listado de compras en mobile (ver globals.css ".compras-mobile-list",
// oculta en desktop donde se usa la <table> completa). Solo muestra lo esencial para reconocer la
// compra de un vistazo — el resto de los campos (categoría, costo unitario, N° guía, merma,
// estado como texto) vive en la hoja de detalle que se abre al tocar la tarjeta.
export default function CompraCardMobile({ compra }: { compra: CompraResumen }) {
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [abierto]);

  return (
    <>
      <button type="button" className="compra-card" onClick={() => setAbierto(true)}>
        <div className="compra-card-top">
          <span className="compra-card-producto">{compra.productoNombre}</span>
          <EstadoDot estado={compra.estado} />
        </div>
        <div className="compra-card-sub">
          {compra.codigoEstacion} · {compra.proveedor}
        </div>
        <div className="compra-card-bottom">
          <span>{formatFechaCorta(compra.fecha)}</span>
          <span>{formatCantidad(compra.cantidad)}</span>
          <span>{formatMoneda(compra.costoTotal)}</span>
        </div>
      </button>

      {abierto && (
        <button
          type="button"
          className="sheet-backdrop"
          onClick={() => setAbierto(false)}
          aria-label="Cerrar detalle"
        />
      )}

      <div
        className={`sheet${abierto ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!abierto}
        aria-label={`Detalle de compra ${compra.numeroGuia}`}
      >
        <div className="sheet-handle" />
        <h2 className="sheet-title">{compra.productoNombre}</h2>
        <dl className="sheet-detail">
          <dt>Fecha</dt>
          <dd>{formatFechaNegocio(compra.fecha)}</dd>
          <dt>Estación</dt>
          <dd>{compra.codigoEstacion}</dd>
          <dt>Categoría</dt>
          <dd>{compra.categoria === "COMBUSTIBLE" ? "Combustible" : "No combustible"}</dd>
          <dt>Cantidad</dt>
          <dd>{formatCantidad(compra.cantidad)}</dd>
          <dt>Costo unitario</dt>
          <dd>{formatMoneda(compra.costoUnitario)}</dd>
          <dt>Costo total</dt>
          <dd>{formatMoneda(compra.costoTotal)}</dd>
          <dt>Proveedor</dt>
          <dd>{compra.proveedor}</dd>
          <dt>N° guía</dt>
          <dd>{compra.numeroGuia}</dd>
          <dt>Merma</dt>
          <dd className={compra.merma !== null && compra.merma > 0 ? "merma-alerta" : undefined}>
            {compra.merma === null ? "—" : formatCantidad(compra.merma)}
          </dd>
          <dt>Estado</dt>
          <dd>{ESTADO_LABELS[compra.estado]}</dd>
          <dt>Registrado</dt>
          <dd>{formatFechaRegistro(compra.creadoEn)}</dd>
        </dl>
        <div className="sheet-actions">
          <Link className="btn" href={`/compras/${compra.id}`}>
            Ver / Editar
          </Link>
          {compra.estado === "ACTIVO" && <AnularCompraButton compraId={compra.id} />}
          <button type="button" className="btn" onClick={() => setAbierto(false)}>
            Cerrar
          </button>
        </div>
      </div>
    </>
  );
}
