import { NextResponse } from "next/server";
import { FuelHubApiError } from "./fuelhub/client";
import { getFuelWebSession } from "./session";
import type { ApiErrorBody } from "./fuelhub/types";

/** 401 uniforme (sección 5) cuando no hay sesión de persona válida en FuelWeb. */
export function unauthorized(): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    { error: "NO_AUTENTICADO", message: "Debes iniciar sesión en FuelWeb." },
    { status: 401 }
  );
}

export function forbidden(message: string): NextResponse<ApiErrorBody> {
  return NextResponse.json({ error: "NO_AUTORIZADO", message }, { status: 403 });
}

/**
 * Ejecuta un handler de ruta requiriendo sesión de persona, y traduce cualquier
 * FuelHubApiError al mismo status/shape que ya usa toda la API (passthrough, sección 5) en vez
 * de enmascararlo como un 500 genérico.
 */
export async function withSession<T>(
  handler: (role: string | undefined) => Promise<NextResponse<T>>
): Promise<NextResponse<T | ApiErrorBody>> {
  const session = await getFuelWebSession();
  if (!session) return unauthorized();

  try {
    return await handler((session.user as { role?: string } | undefined)?.role);
  } catch (err) {
    if (err instanceof FuelHubApiError) {
      return NextResponse.json(err.body, { status: err.status });
    }
    console.error("Error inesperado llamando a FuelHub Cloud:", err);
    return NextResponse.json(
      { error: "ERROR_INTERNO", message: "Error inesperado hablando con FuelHub Cloud." },
      { status: 500 }
    );
  }
}
