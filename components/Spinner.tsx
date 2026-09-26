// Spinner único reutilizado en toda la app: dentro de botones mientras corre una acción (crear,
// guardar, anular, cerrar sesión, filtrar) y en tarjetas de reporte mientras cargan datos.
export default function Spinner({ size = 14 }: { size?: number }) {
  return (
    <span
      className="spinner"
      style={{ width: size, height: size, borderWidth: Math.max(2, Math.round(size / 7)) }}
      role="status"
      aria-label="Cargando"
    />
  );
}
