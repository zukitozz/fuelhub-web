import type { EstadoCompra } from "@/lib/fuelhub/types";
import { ESTADO_DOT_COLOR, ESTADO_LABELS } from "@/lib/estado";

// Versión compacta de EstadoBadge para espacios reducidos (tarjetas mobile): un punto de color en
// vez de texto. El estado sigue siendo accesible vía aria-label/title, no solo por color.
export default function EstadoDot({ estado }: { estado: EstadoCompra }) {
  const label = ESTADO_LABELS[estado] ?? estado;
  return (
    <span
      className="estado-dot"
      style={{ background: ESTADO_DOT_COLOR[estado] ?? ESTADO_DOT_COLOR.ANULADO }}
      role="img"
      aria-label={`Estado: ${label}`}
      title={label}
    />
  );
}
