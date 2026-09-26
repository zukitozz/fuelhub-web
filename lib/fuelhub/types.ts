// Tipos espejo del contrato de FuelHub Cloud (openapi.yaml, fuelhub-core) — solo los campos
// que este frontend necesita. Ante cualquier duda de detalle, openapi.yaml manda (spec frontend
// sección "Fuente de verdad").

export type Categoria = "COMBUSTIBLE" | "NO_COMBUSTIBLE";
// ACTIVO/ANULADO estaban documentados; PENDIENTE_REVISION se confirmó existiendo en prod
// (fuelhub-nonato-prod.compras) pero no en este contrato — validar contra openapi.yaml si
// aparecen más valores.
export type EstadoCompra = "ACTIVO" | "ANULADO" | "PENDIENTE_REVISION";

export interface DestinoInput {
  tanqueId: string;
  cantidad: number;
}

export interface DestinoOutput extends DestinoInput {
  // El contrato puede incluir más campos por destino (p.ej. estacionCodigo del tanque);
  // se acceden como opcionales hasta confirmar el shape exacto contra openapi.yaml.
  estacionCodigo?: string;
  tanqueNombre?: string;
}

// Campos comunes a CompraResumen (listado) y CompraOutput (detalle).
export interface CompraBase {
  id: string;
  codigoEstacion: string;
  fecha: string; // ISO 8601 con offset
  productoId: string | null;
  productoNombre: string;
  categoria: Categoria;
  proveedor: string;
  numeroGuia: string;
  cantidad: number;
  costoUnitario: number;
  costoTotal: number; // columna calculada por Postgres, siempre solo lectura
  // Siempre calculada por el backend, nunca se envía. `null` = compra sin destino/tanque
  // registrado todavía (no es cero) — confirmado en la API real, distinto de lo documentado.
  merma: number | null;
  estado: EstadoCompra;
  // Timestamp de auditoría (cuándo se registró en el sistema) — distinto de `fecha`, que es la
  // fecha del comprobante. No estaba en el contrato documentado; confirmado en la API real el
  // 2026-09-26. Formato del backend: "YYYY-MM-DD HH:mm:ss.ssssss" sin offset — ver
  // formatFechaRegistro() en lib/format.ts sobre cómo se interpreta la zona horaria.
  creadoEn: string;
}

// GET /compras -> data[]: mismos campos que CompraOutput excepto destinos[] (se omite por volumen).
export type CompraResumen = CompraBase;

// GET /compras/{id}, respuesta de POST /compras y PUT /compras/{id}.
export interface CompraOutput extends CompraBase {
  destinos: DestinoOutput[];
}

// Body de POST /compras. codigoEstacion es fijo al crear (regla 4.7 — no editable después).
// productoId XOR (productoNombre + categoria) — regla 4.1.
export interface CompraCreateInput {
  codigoEstacion: string;
  productoId?: string;
  productoNombre?: string;
  categoria?: Categoria;
  proveedor: string;
  fecha: string;
  cantidad: number;
  costoUnitario: number;
  numeroGuia: string;
  destinos: DestinoInput[];
}

// Body de PUT /compras/{id} — PUT parcial: solo los campos que cambiaron (regla 4.6).
// No incluye codigoEstacion (regla 4.7), ni merma/costoTotal (siempre de solo lectura).
// Si se incluye destinos, REEMPLAZA todo el arreglo anterior (no hace merge).
export interface CompraUpdateInput {
  productoId?: string | null;
  productoNombre?: string;
  categoria?: Categoria;
  proveedor?: string;
  fecha?: string;
  cantidad?: number;
  costoUnitario?: number;
  numeroGuia?: string;
  destinos?: DestinoInput[];
  estado?: EstadoCompra;
}

export interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ComprasListResponse {
  data: CompraResumen[];
  pagination: Pagination;
}

export interface ComprasListParams {
  estacionCodigo?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  estado?: EstadoCompra;
  productoId?: string;
  categoria?: Categoria;
  page?: number;
  pageSize?: number;
}

// GET /tanques — sin paginar (volumen bajo). Campos mínimos para el selector de destinos;
// puede traer más campos (capacidad, productoId asignado) según openapi.yaml.
export interface Tanque {
  id: string;
  codigoEstacion: string;
  nombre?: string;
  productoId?: string;
  capacidad?: number;
  activo?: boolean;
}

// Shape uniforme de error de toda la API (spec frontend, sección 5).
export interface ApiErrorBody {
  error: string;
  message: string;
  details?: { field: string; issue: string }[];
}

export const ESTACIONES = [
  { codigo: "CHANCAYLLO", nombre: "Chancayllo" },
  { codigo: "MALA", nombre: "Mala" },
  { codigo: "ANDAHUASI", nombre: "Andahuasi" },
  { codigo: "PACHACUTEC", nombre: "Pachacutec" },
] as const;

// ---- Reportes (spec-agente-reportes-fuelhub.md) — solo lectura, ninguno escribe datos. ----

export interface ReporteDiaProducto {
  productoId: string | null;
  producto: string;
  categoria: Categoria | null; // null = línea sin clasificar al registrar el cierre de turno
  cantidadVendida: number;
  ingresos: number;
}

export interface ReporteDia {
  estacionCodigo: string;
  fechaNegocio: string;
  cierreDiaId: string;
  total: number;
  totalCombustible: number;
  totalNoCombustible: number;
  totalSinClasificar: number;
  productos: ReporteDiaProducto[];
}

export interface ReporteMargenItem {
  estacion: string;
  ingresosTotales: number;
  costoVentasEstimado: number;
  margenEstimado: number;
}

export interface ReporteAbastecimientoItem {
  estacion: string;
  tanque: string;
  producto: string;
  capacidad: number;
  ventaPromedioDiaria: number | null;
  diasDeAutonomiaEstimados: number | null;
  frecuenciaRealDias: number | null;
  enRiesgo: boolean;
}

// TODO: reemplazar por el catálogo real de productos_maestro (los 5 combustibles del catálogo
// cruzado). Este documento no trae el listado exacto de productoId/nombre — pídelo o confírmalo
// contra openapi.yaml / la tabla productos_maestro antes de ir a producción.
export const CATALOGO_PRODUCTOS_PLACEHOLDER = [
  { id: "PLACEHOLDER_GASOHOL_90", nombre: "Gasohol 90", categoria: "COMBUSTIBLE" as Categoria },
  { id: "PLACEHOLDER_GASOHOL_95", nombre: "Gasohol 95", categoria: "COMBUSTIBLE" as Categoria },
  { id: "PLACEHOLDER_GASOHOL_97", nombre: "Gasohol 97", categoria: "COMBUSTIBLE" as Categoria },
  { id: "PLACEHOLDER_DIESEL_B5", nombre: "Diésel B5 S-50", categoria: "COMBUSTIBLE" as Categoria },
  { id: "PLACEHOLDER_GLP", nombre: "GLP", categoria: "COMBUSTIBLE" as Categoria },
];
