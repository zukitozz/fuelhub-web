"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  CATALOGO_PRODUCTOS_PLACEHOLDER,
  ESTACIONES,
  type ApiErrorBody,
  type CompraOutput,
  type Categoria,
  type DestinoInput,
} from "@/lib/fuelhub/types";
import DestinosEditor from "./DestinosEditor";
import ErrorBanner from "./ErrorBanner";
import Spinner from "./Spinner";
import { formatFechaRegistro, formatMoneda } from "@/lib/format";

interface Props {
  modo: "crear" | "editar";
  inicial?: CompraOutput; // solo en modo "editar"
}

// Formulario único, compartido entre crear y editar (spec sección 3.1). Refleja las reglas de
// negocio de la sección 4 en el cliente — la validación real y final siempre es la del backend.
export default function CompraForm({ modo, inicial }: Props) {
  const router = useRouter();

  const [codigoEstacion, setCodigoEstacion] = useState(inicial?.codigoEstacion ?? ESTACIONES[0].codigo ?? "");

  // Regla 4.1: catálogo vs. mercadería, mutuamente excluyente.
  const [usaCatalogo, setUsaCatalogo] = useState(inicial ? inicial.productoId !== null : true);
  const [productoId, setProductoId] = useState(
    inicial?.productoId ?? CATALOGO_PRODUCTOS_PLACEHOLDER[0]?.id ?? ""
  );
  const [productoNombre, setProductoNombre] = useState(inicial?.productoNombre ?? "");
  const [categoria, setCategoria] = useState<Categoria>(inicial?.categoria ?? "COMBUSTIBLE");

  const [proveedor, setProveedor] = useState(inicial?.proveedor ?? "");
  const [fecha, setFecha] = useState(inicial?.fecha?.slice(0, 10) ?? "");
  const [cantidad, setCantidad] = useState(inicial?.cantidad ?? 0);
  const [costoUnitario, setCostoUnitario] = useState(inicial?.costoUnitario ?? 0);
  const [numeroGuia, setNumeroGuia] = useState(inicial?.numeroGuia ?? "");

  const [destinos, setDestinos] = useState<DestinoInput[]>(
    inicial?.destinos.map((d) => ({ tanqueId: d.tanqueId, cantidad: d.cantidad })) ?? []
  );
  const [destinosTocados, setDestinosTocados] = useState(false);

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<ApiErrorBody | string | null>(null);

  const sumaDestinos = destinos.reduce((acc, d) => acc + (Number(d.cantidad) || 0), 0);
  const excedeCantidad = sumaDestinos > cantidad;
  // openapi.yaml (CompraInput.destinos): "Ausente/vacío = compra sin tanque asociado (p. ej.
  // mercadería)" — solo exigimos al menos un destino cuando es combustible del catálogo.
  const destinosObligatorios = usaCatalogo;
  const puedeGuardar =
    !excedeCantidad && (!destinosObligatorios || destinos.length > 0) && !guardando;

  function onCambiarDestinos(nuevos: DestinoInput[]) {
    setDestinosTocados(true);
    setDestinos(nuevos);
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (excedeCantidad) {
      setError("No puedes repartir a los tanques más de lo comprado.");
      return;
    }
    if (!usaCatalogo && (!productoNombre || !categoria)) {
      setError("Para mercadería sin catálogo, producto y categoría son obligatorios.");
      return;
    }

    setGuardando(true);
    try {
      if (modo === "crear") {
        const body = {
          codigoEstacion,
          ...(usaCatalogo ? { productoId } : { productoNombre, categoria }),
          proveedor,
          fecha,
          cantidad,
          costoUnitario,
          numeroGuia,
          destinos,
        };
        const res = await fetch("/api/compras", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          setError((await res.json()) as ApiErrorBody);
          return;
        }
        const creada = (await res.json()) as CompraOutput;
        router.push(`/compras/${creada.id}`);
        router.refresh();
      } else if (inicial) {
        // PUT parcial (regla 4.6): solo los campos que efectivamente cambiaron. destinos[], si
        // se manda, reemplaza TODO el arreglo anterior — se manda completo si el usuario lo tocó.
        const patch: Record<string, unknown> = {};
        if (usaCatalogo && productoId !== inicial.productoId) patch.productoId = productoId;
        if (!usaCatalogo && productoNombre !== inicial.productoNombre) {
          patch.productoNombre = productoNombre;
        }
        if (!usaCatalogo && categoria !== inicial.categoria) patch.categoria = categoria;
        if (proveedor !== inicial.proveedor) patch.proveedor = proveedor;
        if (fecha !== inicial.fecha.slice(0, 10)) patch.fecha = fecha;
        if (cantidad !== inicial.cantidad) patch.cantidad = cantidad;
        if (costoUnitario !== inicial.costoUnitario) patch.costoUnitario = costoUnitario;
        if (numeroGuia !== inicial.numeroGuia) patch.numeroGuia = numeroGuia;
        if (destinosTocados) patch.destinos = destinos;

        if (Object.keys(patch).length === 0) {
          router.push(`/compras/${inicial.id}`);
          return;
        }

        const res = await fetch(`/api/compras/${inicial.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!res.ok) {
          setError((await res.json()) as ApiErrorBody);
          return;
        }
        router.push(`/compras/${inicial.id}`);
        router.refresh();
      }
    } catch {
      setError("No se pudo guardar la compra. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} style={{ maxWidth: 640 }}>
      {error && <ErrorBanner error={error} />}

      <div className="field">
        <label>Estación</label>
        {modo === "crear" ? (
          <select value={codigoEstacion} onChange={(e) => setCodigoEstacion(e.target.value)}>
            {ESTACIONES.map((e) => (
              <option key={e.codigo} value={e.codigo}>
                {e.nombre}
              </option>
            ))}
          </select>
        ) : (
          // Regla 4.7: la estación es fija al editar, no aparece como campo editable.
          <input value={codigoEstacion} disabled />
        )}
      </div>

      <div className="field">
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            type="checkbox"
            checked={usaCatalogo}
            onChange={(e) => setUsaCatalogo(e.target.checked)}
          />
          Producto del catálogo (combustible)
        </label>
      </div>

      {usaCatalogo ? (
        <>
          <div className="field">
            <label>Producto (catálogo)</label>
            <select
              value={productoId}
              onChange={(e) => {
                const p = CATALOGO_PRODUCTOS_PLACEHOLDER.find((x) => x.id === e.target.value);
                setProductoId(e.target.value);
                if (p) setCategoria(p.categoria);
              }}
            >
              {CATALOGO_PRODUCTOS_PLACEHOLDER.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
          {/* Regla 4.2: si viene de catálogo, categoría es de solo lectura. */}
          <div className="field">
            <label>Categoría (del catálogo)</label>
            <input value={categoria} disabled />
          </div>
        </>
      ) : (
        <>
          <div className="field">
            <label>Producto (mercadería, texto libre)</label>
            <input
              value={productoNombre}
              onChange={(e) => setProductoNombre(e.target.value)}
              placeholder="p.ej. Galletas Soda"
              required
            />
          </div>
          <div className="field">
            <label>Categoría</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value as Categoria)}>
              <option value="COMBUSTIBLE">Combustible</option>
              <option value="NO_COMBUSTIBLE">No combustible</option>
            </select>
          </div>
        </>
      )}

      <div className="field">
        <label>Proveedor</label>
        <input value={proveedor} onChange={(e) => setProveedor(e.target.value)} required />
      </div>

      <div className="field">
        <label>Fecha</label>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <div className="field" style={{ flex: 1 }}>
          <label>Cantidad</label>
          <input
            type="number"
            step="0.001"
            min={0}
            value={cantidad}
            onChange={(e) => setCantidad(Number(e.target.value))}
            required
          />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>Costo unitario</label>
          <input
            type="number"
            step="0.0001"
            min={0}
            value={costoUnitario}
            onChange={(e) => setCostoUnitario(Number(e.target.value))}
            required
          />
        </div>
      </div>

      <div className="field">
        <label>N° guía</label>
        <input value={numeroGuia} onChange={(e) => setNumeroGuia(e.target.value)} required />
      </div>

      {/* costoTotal: solo lectura, columna calculada — nunca se manda al crear/editar */}
      {inicial && (
        <div className="field">
          <label>Costo total (calculado)</label>
          <input value={formatMoneda(inicial.costoTotal)} disabled />
        </div>
      )}

      {/* creadoEn: metadata de auditoría, no es un campo del negocio — nunca editable. Distinto
          de "fecha", que es la fecha del comprobante. */}
      {inicial && (
        <div className="field">
          <label>Fecha de registro</label>
          <input value={formatFechaRegistro(inicial.creadoEn)} disabled />
        </div>
      )}

      <DestinosEditor
        destinos={destinos}
        onChange={onCambiarDestinos}
        cantidadCompra={cantidad}
        obligatorio={destinosObligatorios}
      />

      <button type="submit" className="btn btn-primary" disabled={!puedeGuardar}>
        {guardando && <Spinner size={12} />}
        {guardando ? "Guardando…" : modo === "crear" ? "Crear compra" : "Guardar cambios"}
      </button>
    </form>
  );
}
