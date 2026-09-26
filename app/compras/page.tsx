import Link from "next/link";
import { listarCompras } from "@/lib/fuelhub/compras";
import { formatCantidad, formatFechaNegocio, formatMoneda } from "@/lib/format";
import type { Categoria, EstadoCompra } from "@/lib/fuelhub/types";
import ComprasFilters from "@/components/ComprasFilters";
import Pagination from "@/components/Pagination";
import EstadoBadge from "@/components/EstadoBadge";
import AnularCompraButton from "@/components/AnularCompraButton";
import CompraCardMobile from "@/components/CompraCardMobile";
import ErrorBanner from "@/components/ErrorBanner";
import { FuelHubApiError } from "@/lib/fuelhub/client";

// Listado de compras (spec sección 3.1). Server component: llama directo a la capa de dominio
// (lib/fuelhub/compras) en vez de a la propia ruta de API — evita un salto de red extra, pero
// sigue siendo 100% dentro de FuelWeb (el navegador nunca toca FuelHub Cloud, regla 2.2).
export default async function ComprasPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  try {
    const { data, pagination } = await listarCompras({
      estacionCodigo: searchParams.estacionCodigo,
      fechaDesde: searchParams.fechaDesde,
      fechaHasta: searchParams.fechaHasta,
      estado: searchParams.estado as EstadoCompra | undefined,
      categoria: searchParams.categoria as Categoria | undefined,
      productoId: searchParams.productoId,
      page: searchParams.page ? Number(searchParams.page) : 1,
    });

    return (
      <main className="page" style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <h1>Compras</h1>
          <Link href="/compras/nuevo" className="btn btn-primary">
            + Nueva compra
          </Link>
        </div>

        <ComprasFilters />

        <div className="compras-table-wrapper" style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Estación</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Cantidad</th>
                <th>Costo unit.</th>
                <th>Costo total</th>
                <th>Proveedor</th>
                <th>N° guía</th>
                <th>Merma</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id}>
                  <td>{formatFechaNegocio(c.fecha)}</td>
                  <td>{c.codigoEstacion}</td>
                  <td>{c.productoNombre}</td>
                  <td>{c.categoria === "COMBUSTIBLE" ? "Combustible" : "No combustible"}</td>
                  <td>{formatCantidad(c.cantidad)}</td>
                  <td>{formatMoneda(c.costoUnitario)}</td>
                  <td>{formatMoneda(c.costoTotal)}</td>
                  <td>{c.proveedor}</td>
                  <td>{c.numeroGuia}</td>
                  <td className={c.merma !== null && c.merma > 0 ? "merma-alerta" : undefined}>
                    {c.merma === null ? "—" : formatCantidad(c.merma)}
                  </td>
                  <td>
                    <EstadoBadge estado={c.estado} />
                  </td>
                  <td style={{ display: "flex", gap: 6 }}>
                    <Link className="btn" href={`/compras/${c.id}`}>
                      Ver / Editar
                    </Link>
                    {c.estado === "ACTIVO" && <AnularCompraButton compraId={c.id} />}
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={12} style={{ textAlign: "center", color: "var(--text-muted)" }}>
                    No hay compras para estos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="compras-mobile-list">
          {data.map((c) => (
            <CompraCardMobile key={c.id} compra={c} />
          ))}
          {data.length === 0 && <p className="empty-mobile">No hay compras para estos filtros.</p>}
        </div>

        <Pagination pagination={pagination} />
      </main>
    );
  } catch (err) {
    const message =
      err instanceof FuelHubApiError
        ? err.body
        : "No se pudo cargar el listado de compras. Intenta de nuevo.";
    return (
      <main className="page" style={{ maxWidth: 1200, margin: "0 auto" }}>
        <h1>Compras</h1>
        <ErrorBanner error={message} />
      </main>
    );
  }
}
