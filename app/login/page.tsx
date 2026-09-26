"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import Spinner from "@/components/Spinner";

function Redirigiendo() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  useEffect(() => {
    signIn("cognito", { callbackUrl });
  }, [callbackUrl]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: 12 }}>
      <Spinner size={24} />
      <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Redirigiendo a inicio de sesión…</p>
    </div>
  );
}

// Sin pantalla de login propia (sección 2.5): apenas se llega acá, se dispara el redirect al
// Hosted UI de Cognito. Es el target de authOptions.pages.signIn en lib/auth.ts.
//
// useSearchParams() obliga a envolver en <Suspense> (Next.js exige esto para poder prerenderizar
// la página en el build) — se aisló en Redirigiendo() en vez de ponerlo directo acá para que el
// fallback de Suspense sea el spinner y no una pantalla en blanco durante ese instante.
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
          <Spinner size={24} />
        </div>
      }
    >
      <Redirigiendo />
    </Suspense>
  );
}
