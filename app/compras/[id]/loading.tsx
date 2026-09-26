import Spinner from "@/components/Spinner";

// Cubre la navegación a /compras/[id] mientras el server component espera `await obtenerCompra`.
export default function CargandoCompra() {
  return (
    <main className="page" style={{ maxWidth: 700, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
        <Spinner size={28} />
      </div>
    </main>
  );
}
