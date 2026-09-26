import VentasPastelChart from "@/components/reportes/VentasPastelChart";
import MargenRankingChart from "@/components/reportes/MargenRankingChart";
import MargenMensualChart from "@/components/reportes/MargenMensualChart";
import GastoMensualChart from "@/components/reportes/GastoMensualChart";
import AbastecimientoPanel from "@/components/reportes/AbastecimientoPanel";
import ComprasPorProveedorChart from "@/components/reportes/ComprasPorProveedorChart";
import CostoUnitarioChart from "@/components/reportes/CostoUnitarioChart";
import PendientesRevisionPanel from "@/components/reportes/PendientesRevisionPanel";
import MermaAcumuladaChart from "@/components/reportes/MermaAcumuladaChart";

// Dashboard de reportes (spec-agente-reportes-fuelhub.md) — cada tarjeta pide sus propios datos
// de forma independiente (son "use client") para no bloquear el resto de la pantalla si un
// reporte tarda o falla; el layout es solo del lado del servidor.
export default function ReportesPage() {
  return (
    <main className="page" style={{ maxWidth: 1400, margin: "0 auto" }}>
      <h1>Reportes</h1>
      <div className="reportes-grid">
        <VentasPastelChart />
        <GastoMensualChart />
        <MargenMensualChart />
        <MargenRankingChart />
        <PendientesRevisionPanel />
        <ComprasPorProveedorChart />
        <MermaAcumuladaChart />
        <CostoUnitarioChart />
        <AbastecimientoPanel />
      </div>
    </main>
  );
}
