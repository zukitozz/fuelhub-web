import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/** Sesión de la persona logueada en FuelWeb (nunca la sesión M2M — ver sección 2.5/2.6). */
export async function getFuelWebSession() {
  return getServerSession(authOptions);
}

export async function getFuelWebRole(): Promise<string | undefined> {
  const session = await getFuelWebSession();
  return (session?.user as { role?: string } | undefined)?.role;
}
