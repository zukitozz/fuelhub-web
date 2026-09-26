// Sesión de PERSONA en FuelWeb (spec frontend, sección 2.5) — completamente independiente de
// la sesión M2M (lib/fuelhub/m2mToken.ts). Reutiliza el User Pool "jdpalk" que ya usa la app
// móvil FuelHubGo, pero vía un App Client NUEVO (Authorization Code + Hosted UI, con PKCE),
// distinto del que usa FuelHubGo (que hace USER_PASSWORD_AUTH/SRP directo).
//
// NextAuth resuelve automáticamente los endpoints de authorize/token/userinfo por OIDC
// discovery contra COGNITO_JDPALK_ISSUER (requiere que el pool tenga un dominio de Hosted UI
// configurado — parte de la tarea pendiente de la sección 9/2.3).

import type { AuthOptions } from "next-auth";
import CognitoProvider from "next-auth/providers/cognito";

export const authOptions: AuthOptions = {
  providers: [
    CognitoProvider({
      issuer: process.env.COGNITO_JDPALK_ISSUER,
      clientId: process.env.COGNITO_JDPALK_CLIENT_ID ?? "",
      clientSecret: process.env.COGNITO_JDPALK_CLIENT_SECRET ?? "",
      // Sin esto NextAuth solo pide "openid" (default de openid-client) y nunca llegan
      // email/name/custom:role al perfil OIDC — el App Client necesita el scope "profile"
      // habilitado y permiso de lectura sobre custom:role (ver README, sección "Cognito").
      authorization: { params: { scope: "openid email profile" } },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // Copia el claim de rol (custom:role) o el primer grupo de Cognito del perfil OIDC al
    // token de sesión de NextAuth, para que las rutas de la API y la UI puedan leerlo sin
    // volver a llamar a Cognito (sección 2.5: "usar grupos de Cognito o un claim custom:role
    // propio para que FuelWeb decida sus propios permisos").
    async jwt({ token, profile }) {
      const p = profile as Record<string, unknown> | undefined;
      if (p) {
        const groups = p["cognito:groups"];
        const customRole = p["custom:role"];
        token.role =
          (typeof customRole === "string" && customRole) ||
          (Array.isArray(groups) && typeof groups[0] === "string" ? groups[0] : undefined) ||
          token.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string | undefined;
      }
      return session;
    },
  },
  pages: {
    // OJO: esto NO puede apuntar a "/api/auth/signin" — NextAuth usa pages.signIn para decidir
    // si redirige a una página propia en vez de la suya, y si coinciden se redirige a sí mismo
    // en loop infinito (ERR_TOO_MANY_REDIRECTS). "/login" es una ruta normal de Next.js (fuera
    // del catch-all de NextAuth) que dispara el redirect al Hosted UI sin loop.
    signIn: "/login",
  },
};
