import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import Providers from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "FuelWeb — Sircon-Nonato",
  description: "Gestión de compras, cierres y reportes de FuelHub Cloud.",
};

// Next.js suele inyectar esto solo, pero lo dejamos explícito para no depender de eso: sin este
// viewport, el navegador móvil renderiza a ~980px y "achica" todo, y las media queries de
// globals.css nunca se disparan.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
