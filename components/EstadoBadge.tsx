import type { EstadoCompra } from "@/lib/fuelhub/types";
import { ESTADO_LABELS } from "@/lib/estado";

const CLASSES: Record<EstadoCompra, string> = {
  ACTIVO: "badge-activo",
  ANULADO: "badge-anulado",
  PENDIENTE_REVISION: "badge-revision",
};

export default function EstadoBadge({ estado }: { estado: EstadoCompra }) {
  return (
    <span className={`badge ${CLASSES[estado] ?? "badge-anulado"}`}>{ESTADO_LABELS[estado] ?? estado}</span>
  );
}
