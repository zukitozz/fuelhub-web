import { NextRequest, NextResponse } from "next/server";

// signOut() de NextAuth (llamado desde el cliente antes de venir acá) solo borra la cookie de
// sesión de FuelWeb — Cognito Hosted UI mantiene su propia sesión de navegador aparte. Sin este
// redirect a su endpoint /logout, la siguiente vez que alguien toque "Iniciar sesión" volvería a
// entrar sin pedir credenciales. Ver README sección "Cognito" sobre HOSTED_UI_DOMAIN.
export async function GET(req: NextRequest) {
  const domain = process.env.COGNITO_JDPALK_HOSTED_UI_DOMAIN;
  const clientId = process.env.COGNITO_JDPALK_CLIENT_ID;
  const logoutUri = process.env.NEXTAUTH_URL ?? req.nextUrl.origin;

  if (!domain || !clientId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const cognitoLogoutUrl = `${domain}/logout?${new URLSearchParams({
    client_id: clientId,
    logout_uri: logoutUri,
  })}`;
  return NextResponse.redirect(cognitoLogoutUrl);
}
