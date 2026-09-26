import CompraForm from "@/components/CompraForm";

export default function NuevaCompraPage() {
  return (
    <main className="page" style={{ maxWidth: 700, margin: "0 auto" }}>
      <h1>Nueva compra</h1>
      <CompraForm modo="crear" />
    </main>
  );
}
