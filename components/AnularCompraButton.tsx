"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ApiErrorBody } from "@/lib/fuelhub/types";
import ErrorBanner from "./ErrorBanner";
import Spinner from "./Spinner";

// Regla 5 de la spec: nunca "eliminar" — siempre "anular", dejando explícito que el registro
// queda trazable y no desaparece.
export default function AnularCompraButton({ compraId }: { compraId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiErrorBody | string | null>(null);

  async function anular() {
    const confirmado = window.confirm(
      "¿Anular esta compra? No se elimina: queda registrada como ANULADO para trazabilidad."
    );
    if (!confirmado) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/compras/${compraId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "ANULADO" }),
      });
      if (!res.ok) {
        setError((await res.json()) as ApiErrorBody);
        return;
      }
      router.refresh();
    } catch {
      setError("No se pudo anular la compra. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button className="btn btn-danger" onClick={anular} disabled={loading}>
        {loading && <Spinner size={12} />}
        {loading ? "Anulando…" : "Anular"}
      </button>
      {error && <ErrorBanner error={error} />}
    </div>
  );
}
