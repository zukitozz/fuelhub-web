// Leyenda genérica: swatch de color + texto en tinta neutra (nunca el texto pintado del color de
// la serie). Obligatoria desde 2 series (marks-and-anatomy.md); para 1 sola serie no se usa, el
// título de la tarjeta ya dice qué se grafica.
export default function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  if (items.length < 2) return null;
  return (
    <div className="chart-legend">
      {items.map((item) => (
        <span key={item.label} className="chart-legend-item">
          <span className="chart-legend-swatch" style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}
