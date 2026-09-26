import type { ApiErrorBody } from "@/lib/fuelhub/types";

/**
 * Muestra el error uniforme de la API (sección 5): message a nivel general, y cada
 * details[].field/issue si vienen (el formulario los puede además mapear a su campo).
 */
export default function ErrorBanner({ error }: { error: ApiErrorBody | string }) {
  if (typeof error === "string") {
    return <div className="error-banner">{error}</div>;
  }
  return (
    <div className="error-banner">
      <div>{error.message}</div>
      {error.details && error.details.length > 0 && (
        <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
          {error.details.map((d, i) => (
            <li key={i}>
              <strong>{d.field}:</strong> {d.issue}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
