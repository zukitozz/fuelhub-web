// Tooltip genérico para todos los gráficos de recharts. El tooltip por defecto de recharts pinta
// el texto del color de la serie — eso viola la regla "el texto nunca lleva el color del dato"
// (marks-and-anatomy.md): acá el swatch lleva el color, el texto siempre usa tinta neutra.
interface Entrada {
  name?: string;
  value?: number | string;
  color?: string;
  payload?: Record<string, unknown>;
}

export default function ChartTooltip({
  active,
  label,
  payload,
  formatValor = (v) => String(v),
}: {
  active?: boolean;
  label?: string;
  payload?: Entrada[];
  formatValor?: (valor: number | string) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="chart-tooltip">
      {label && <div className="chart-tooltip-label">{label}</div>}
      {payload.map((entry, i) => (
        <div key={i} className="chart-tooltip-row">
          <span className="chart-tooltip-swatch" style={{ background: entry.color }} />
          <span className="chart-tooltip-name">{entry.name}</span>
          <span className="chart-tooltip-value">{entry.value !== undefined ? formatValor(entry.value) : ""}</span>
        </div>
      ))}
    </div>
  );
}
