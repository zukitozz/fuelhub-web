"use client";

// Par de inputs de fecha reutilizado por los widgets que filtran por rango (proveedores, merma,
// costo unitario, ranking de margen).
export default function RangoFechasControl({
  desde,
  hasta,
  onDesde,
  onHasta,
}: {
  desde: string;
  hasta: string;
  onDesde: (v: string) => void;
  onHasta: (v: string) => void;
}) {
  return (
    <>
      <input type="date" value={desde} onChange={(e) => onDesde(e.target.value)} aria-label="Desde" />
      <span style={{ color: "var(--text-muted)", fontSize: 12 }}>a</span>
      <input type="date" value={hasta} onChange={(e) => onHasta(e.target.value)} aria-label="Hasta" />
    </>
  );
}
