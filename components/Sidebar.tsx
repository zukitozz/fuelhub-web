"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import Spinner from "./Spinner";

// Menú lateral de FuelWeb. Cierres todavía no tiene pantalla (ver README, "Siguientes módulos").
const NAV_ITEMS = [
  { href: "/compras", label: "Compras" },
  { href: "/reportes", label: "Reportes" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const [abierto, setAbierto] = useState(false);
  const [cerrandoSesion, setCerrandoSesion] = useState(false);

  // En mobile el sidebar es un drawer superpuesto: se cierra solo al navegar y bloquea el scroll
  // del fondo mientras está abierto para que no se vea el contenido moviéndose detrás.
  useEffect(() => {
    setAbierto(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = abierto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [abierto]);

  async function cerrarSesion() {
    setCerrandoSesion(true);
    // Primero borra la cookie de sesión de FuelWeb, después cierra la sesión de Hosted UI en
    // Cognito (ver app/api/logout) — si solo hiciéramos lo primero, un siguiente login entraría
    // sin pedir credenciales.
    await signOut({ redirect: false });
    window.location.href = "/api/logout";
  }

  return (
    <>
      <header className="mobile-topbar">
        <button className="hamburger" onClick={() => setAbierto(true)} aria-label="Abrir menú">
          ☰
        </button>
        <span className="mobile-topbar-brand">FuelWeb</span>
      </header>

      {abierto && (
        <button
          type="button"
          className="sidebar-backdrop"
          onClick={() => setAbierto(false)}
          aria-label="Cerrar menú"
        />
      )}

      <aside className={`sidebar${abierto ? " open" : ""}`}>
        <div>
          <div className="sidebar-brand">
            FuelWeb
            <button className="sidebar-close" onClick={() => setAbierto(false)} aria-label="Cerrar menú">
              ✕
            </button>
          </div>
          <nav className="sidebar-nav">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={pathname?.startsWith(item.href) ? "active" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="sidebar-user">
          {session?.user && (
            <div>
              <div className="sidebar-user-name">{session.user.name ?? session.user.email}</div>
              {role && <div className="sidebar-user-role">{role}</div>}
            </div>
          )}
          <button className="btn" onClick={cerrarSesion} disabled={cerrandoSesion}>
            {cerrandoSesion && <Spinner size={12} />}
            {cerrandoSesion ? "Cerrando…" : "Cerrar sesión"}
          </button>
        </div>
      </aside>
    </>
  );
}
