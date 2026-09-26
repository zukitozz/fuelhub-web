"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { Pagination as PaginationType } from "@/lib/fuelhub/types";
import Spinner from "./Spinner";

export default function Pagination({ pagination }: { pagination: PaginationType }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [navegando, startTransition] = useTransition();

  function irA(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    startTransition(() => router.push(`/compras?${params.toString()}`));
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 12 }}>
      <button
        className="btn"
        disabled={pagination.page <= 1 || navegando}
        onClick={() => irA(pagination.page - 1)}
      >
        Anterior
      </button>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        {navegando && <Spinner size={12} />}
        Página {pagination.page} de {Math.max(pagination.totalPages, 1)} ({pagination.totalItems}{" "}
        compras)
      </span>
      <button
        className="btn"
        disabled={pagination.page >= pagination.totalPages || navegando}
        onClick={() => irA(pagination.page + 1)}
      >
        Siguiente
      </button>
    </div>
  );
}
