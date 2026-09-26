// Funciones de dominio para el módulo de Compras (spec frontend, sección 3.1) — capa compartida
// entre las rutas de API (app/api/compras/**) y los server components (app/compras/**), para no
// duplicar la construcción de query params ni el manejo de errores.

import { fuelhubFetch } from "./client";
import type {
  CompraCreateInput,
  CompraOutput,
  CompraResumen,
  CompraUpdateInput,
  ComprasListParams,
  ComprasListResponse,
  EstadoCompra,
  Tanque,
} from "./types";

// FuelHub Cloud exige `estado` en GET /compras: omitirlo NO trae "todas", trae 0 resultados
// (confirmado el 2026-09-26 pegándole directo a la API — la ausencia del parámetro no se trata
// como "sin filtro"). Como esta pantalla es la fuente de verdad de compras sin importar su
// estado, cuando no se pide un estado puntual consultamos los 3 estados conocidos en paralelo y
// combinamos el resultado acá. Si FuelHub Cloud agrega soporte real para "todos los estados" en
// una sola llamada, esto se puede volver a simplificar a una sola request con paginación server-side.
const ESTADOS_CONOCIDOS: EstadoCompra[] = ["ACTIVO", "ANULADO", "PENDIENTE_REVISION"];
const MAX_POR_ESTADO = 500; // volumen esperado bajo (compras de una red de 4 estaciones)

export async function listarCompras(params: ComprasListParams): Promise<ComprasListResponse> {
  const baseQuery = {
    estacionCodigo: params.estacionCodigo,
    fechaDesde: params.fechaDesde,
    fechaHasta: params.fechaHasta,
    productoId: params.productoId,
    categoria: params.categoria,
  };

  if (params.estado) {
    return fuelhubFetch<ComprasListResponse>("/compras", {
      query: { ...baseQuery, estado: params.estado, page: params.page ?? 1, pageSize: params.pageSize ?? 20 },
    });
  }

  const respuestas = await Promise.all(
    ESTADOS_CONOCIDOS.map((estado) =>
      fuelhubFetch<ComprasListResponse>("/compras", {
        query: { ...baseQuery, estado, page: 1, pageSize: MAX_POR_ESTADO },
      })
    )
  );

  const combinadas = respuestas.flatMap((r) => r.data).sort((a, b) => b.fecha.localeCompare(a.fecha));

  const pageSize = params.pageSize ?? 20;
  const page = params.page ?? 1;
  const start = (page - 1) * pageSize;

  return {
    data: combinadas.slice(start, start + pageSize),
    pagination: {
      page,
      pageSize,
      totalItems: combinadas.length,
      totalPages: Math.max(1, Math.ceil(combinadas.length / pageSize)),
    },
  };
}

export function obtenerCompra(id: string): Promise<CompraOutput> {
  return fuelhubFetch<CompraOutput>(`/compras/${encodeURIComponent(id)}`);
}

export function crearCompra(input: CompraCreateInput): Promise<CompraOutput> {
  return fuelhubFetch<CompraOutput>("/compras", { method: "POST", body: input });
}

export function actualizarCompra(id: string, input: CompraUpdateInput): Promise<CompraOutput> {
  return fuelhubFetch<CompraOutput>(`/compras/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: input,
  });
}

/**
 * Recorre TODAS las páginas de GET /compras y devuelve el arreglo completo — los reportes
 * (agrupar por proveedor, sumar merma, etc.) necesitan el conjunto completo del rango, no una
 * página (spec-agente-reportes-fuelhub.md sección 5.4: "para un reporte sobre un rango completo,
 * hay que recorrer todas las páginas"). `estado` es obligatorio a propósito: sin él, listarCompras
 * ya hace su propio merge de los 3 estados con pageSize 500 y pagina en memoria — si esta función
 * "recorriera páginas" sobre ese resultado, cada página repetiría las 3 llamadas completas de
 * nuevo. Los reportes financieros además solo deberían mirar compras ACTIVO de todos modos.
 */
export async function listarTodasLasCompras(
  params: Omit<ComprasListParams, "page" | "pageSize"> & { estado: EstadoCompra }
): Promise<CompraResumen[]> {
  const pageSize = 100; // máximo permitido por la API (sección 4)
  const primera = await listarCompras({ ...params, page: 1, pageSize });
  const todas = [...primera.data];
  for (let page = 2; page <= primera.pagination.totalPages; page++) {
    todas.push(...(await listarCompras({ ...params, page, pageSize })).data);
  }
  return todas;
}

export function listarTanques(estacionCodigo?: string): Promise<Tanque[]> {
  return fuelhubFetch<Tanque[]>("/tanques", {
    query: { estacionCodigo },
  });
}

/**
 * Campos que NUNCA deben salir hacia FuelHub Cloud aunque un cliente descuidado los mande
 * (regla 4.4/4.7): merma y costoTotal son siempre de solo lectura, codigoEstacion es fijo al
 * editar. Defensa en profundidad — el backend también los rechaza/ignora, pero no hay que
 * confiar solo en eso.
 */
export function limpiarUpdateInput(raw: Record<string, unknown>): CompraUpdateInput {
  const { merma: _merma, costoTotal: _costoTotal, codigoEstacion: _codigoEstacion, ...rest } = raw;
  return rest as CompraUpdateInput;
}
