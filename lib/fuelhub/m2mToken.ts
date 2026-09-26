// Sesión M2M de FuelWeb hacia FuelHub Cloud (spec frontend, secciones 2.2/2.3/2.6).
//
// Un único App Client "back-office" (custom:station_scope = "*", scopes cierres.read +
// cierres.write) — la misma credencial se usa sin importar qué persona esté detrás (2.6).
// El client_id/secret vive SOLO en el servidor (variables de entorno), nunca llega al navegador.
//
// Cachea el JWT en memoria del proceso y lo renueva proactivamente (sección 6: "FuelWeb debe
// renovarlo proactivamente antes de que expire, no reaccionar recién al primer 401") — se
// renueva si al token le quedan menos de RENEW_BUFFER_MS antes de expirar, en vez de esperar
// a que la API real devuelva 401.
//
// Nota: esta caché es por proceso Node — en un despliegue con múltiples instancias/réplicas
// cada una mantendrá su propio token, lo cual es correcto (cada una es un cliente OAuth
// independiente ante Cognito) pero significa que no hay una única fuente de verdad compartida;
// si eso importa en el futuro (rate limits de Cognito), pasar esta caché a Redis/similar.

interface CachedToken {
  accessToken: string;
  expiresAtMs: number;
}

let cached: CachedToken | null = null;
let inFlight: Promise<string> | null = null;

const RENEW_BUFFER_MS = 5 * 60 * 1000; // renovar 5 min antes de que expire

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name} (sesión M2M hacia FuelHub Cloud) — ver .env.example`
    );
  }
  return value;
}

async function fetchNewToken(): Promise<CachedToken> {
  const tokenUrl = requiredEnv("FUELHUB_TOKEN_URL");
  const clientId = requiredEnv("FUELHUB_M2M_CLIENT_ID");
  const clientSecret = requiredEnv("FUELHUB_M2M_CLIENT_SECRET");

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `No se pudo obtener el token M2M de FuelHub Cloud (HTTP ${res.status}): ${text}`
    );
  }

  const body = (await res.json()) as { access_token: string; expires_in: number };
  return {
    accessToken: body.access_token,
    expiresAtMs: Date.now() + body.expires_in * 1000,
  };
}

/** Devuelve un access token M2M válido, renovándolo si está por vencer. */
export async function getM2mToken(): Promise<string> {
  const now = Date.now();

  if (cached && cached.expiresAtMs - now > RENEW_BUFFER_MS) {
    return cached.accessToken;
  }

  // Evita pedir varios tokens en paralelo si llegan requests concurrentes justo cuando
  // el token está por vencer.
  if (!inFlight) {
    inFlight = fetchNewToken()
      .then((token) => {
        cached = token;
        return token.accessToken;
      })
      .finally(() => {
        inFlight = null;
      });
  }

  return inFlight;
}

/** Fuerza la renovación en el próximo getM2mToken() — útil si FuelHub Cloud devolvió 401. */
export function invalidateM2mToken(): void {
  cached = null;
}
