import Spinner from "@/components/Spinner";

// Next.js muestra esto automáticamente mientras el server component de la página (que hace
// `await listarCompras`) todavía no resuelve — cubre la navegación inicial a /compras.
export default function CargandoCompras() {
  return (
    <main className="page" style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
        <Spinner size={28} />
      </div>
    </main>
  );
}
