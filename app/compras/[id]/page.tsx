import { obtenerCompra } from "@/lib/fuelhub/compras";
import { FuelHubApiError } from "@/lib/fuelhub/client";
import CompraForm from "@/components/CompraForm";
import AnularCompraButton from "@/components/AnularCompraButton";
import ErrorBanner from "@/components/ErrorBanner";

export default async function DetalleCompraPage({ params }: { params: { id: string } }) {
  try {
    const compra = await obtenerCompra(params.id);

    return (
      <main className="page" style={{ maxWidth: 700, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <h1>Compra — {compra.numeroGuia}</h1>
          {compra.estado === "ACTIVO" && <AnularCompraButton compraId={compra.id} />}
        </div>
        <p style={{ margin: "4px 0 16px" }}>
          <strong>N° de comprobante:</strong> {compra.numeroComprobante || "—"}
        </p>
        <CompraForm modo="editar" inicial={compra} />
      </main>
    );
  } catch (err) {
    const message =
      err instanceof FuelHubApiError
        ? err.body
        : "No se pudo cargar la compra. Intenta de nuevo.";
    return (
      <main className="page" style={{ maxWidth: 700, margin: "0 auto" }}>
        <h1>Compra</h1>
        <ErrorBanner error={message} />
      </main>
    );
  }
}
