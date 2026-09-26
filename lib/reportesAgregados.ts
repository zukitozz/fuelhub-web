// Shapes de los reportes que FuelWeb arma agregando GET /compras en el servidor (no vienen así
// de FuelHub Cloud) — a diferencia de lib/fuelhub/types.ts, que son espejo directo del contrato.

export interface ProveedorAgregado {
  proveedor: string;
  costoTotal: number;
  cantidadCompras: number;
}

export interface CostoUnitarioPunto {
  fecha: string;
  costoUnitario: number;
  proveedor: string;
}

export interface PendientesPorEstacion {
  estacion: string;
  cantidad: number;
}

export interface MermaPorEstacion {
  estacion: string;
  merma: number;
}

/** Un punto por mes con el gasto (costoTotal de compras ACTIVO) de cada estación real, más el
 * total — alimenta la barra apilada "gasto mensual" (idea agregada, no está en el documento de
 * spec original). */
export interface GastoMensualPunto {
  mes: string; // "YYYY-MM"
  total: number;
  porEstacion: Record<string, number>;
}
