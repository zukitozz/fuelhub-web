// Protege pantallas y rutas de API detrás del login de persona en FuelWeb (sección 2.6, paso 1).
// La sesión M2M (paso 4 del flujo) es completamente independiente y nunca se valida aquí — vive
// solo en el servidor, en lib/fuelhub/m2mToken.ts.
export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/compras/:path*",
    "/reportes/:path*",
    "/api/compras/:path*",
    "/api/tanques/:path*",
    "/api/reportes/:path*",
  ],
};
