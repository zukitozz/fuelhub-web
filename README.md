# FuelWeb

Frontend + BFF (backend-for-frontend) para la gestión de compras, cierres de turno/día y
reportes de negocio del grupo Sircon-Nonato (Chancayllo, Mala, Andahuasi, Pachacutec) contra
**FuelHub Cloud** (repo `fuelhub-core`, contrato `openapi.yaml`).

Implementado a partir de `specs-frontend-fuelhub-web.md`. Ante cualquier duda de detalle de un
campo o endpoint, `openapi.yaml` de `fuelhub-core` manda sobre este README.

## Qué hay construido en esta primera pasada

Se decidió empezar por **autenticación + el módulo de Compras** (sección 3.1 de la spec), porque
es el único módulo sin ningún bloqueo de backend. Lo demás (cierres de turno/día de solo
lectura, reportes de margen/abastecimiento/día, y el reporte de mermas que ni siquiera tiene
endpoint todavía) queda para una siguiente pasada — la arquitectura base (BFF, sesión M2M,
manejo de errores) ya está lista para que esos módulos se agreguen sin rehacer nada.

- **Arquitectura BFF (sección 2.2)**: el navegador SOLO habla con las rutas `/api/*` de este
  mismo proyecto Next.js (FuelWeb). Ninguna llamada sale del navegador hacia `api.fuelhub.cloud`
  directo — regla de arquitectura no negociable de la spec.
- **Sesión M2M hacia FuelHub Cloud** (`lib/fuelhub/m2mToken.ts`): cachea el JWT de
  `client_credentials` en memoria del servidor y lo renueva proactivamente antes de que expire
  (no espera a un 401). El `client_id`/`client_secret` nunca llega al navegador.
- **Cliente HTTP hacia FuelHub Cloud** (`lib/fuelhub/client.ts`): agrega el `Authorization:
  Bearer`, reintenta una vez ante 503 respetando `Retry-After` (cold-start de Aurora, sección 6),
  y traduce cualquier error al mismo shape uniforme `{error, message, details}` de toda la API
  (sección 5) en vez de esconderlo detrás de un 500 genérico.
- **Sesión de persona en FuelWeb** (`lib/auth.ts`, NextAuth + Cognito provider): login vía
  Authorization Code + Hosted UI contra el pool `jdpalk`, completamente independiente de la
  sesión M2M (sección 2.5/2.6). El rol (`custom:role` o primer grupo de Cognito) queda disponible
  en `session.user.role`.
- **Módulo de Compras completo** (sección 3.1): listado con filtros (estación, fechas, estado,
  categoría) y paginación, crear, editar (PUT parcial), anular — con las reglas de negocio de la
  sección 4 reflejadas en el formulario (catálogo vs. mercadería mutuamente excluyente, categoría
  de solo lectura si es de catálogo, suma de destinos ≤ cantidad validada en vivo, merma siempre
  de solo lectura, "Anular" en vez de "Eliminar", estación fija al editar).

## Qué falta para que esto corra contra AWS de verdad

1. **App Client de Hosted UI para login de personas (pool `jdpalk`) — ✅ resuelto.** En vez de
   crear uno nuevo, se reutilizó el App Client existente **"My web app - jdpalk"**
   (`3qeno4d84n450aipt2rfh03ep6`), que ya usa otra app (`fuelhub.vercel.app` /
   `localhost:8080`) contra el mismo pool. Se le agregó, sin quitar nada de lo existente:
   - Callback/Logout URL de `http://localhost:3000` (además de las que ya tenía).
   - El scope OAuth `profile` (tenía `email`, `openid`, `phone`).
   - Permiso de lectura (`ReadAttributes`) sobre `custom:role`.
   - `lib/auth.ts` se ajustó para pedir explícitamente `scope: "openid email profile"` — sin
     esto NextAuth solo pedía `openid` por defecto y nunca llegaban `email`/`name`/`custom:role`.

   `.env.local` ya tiene `COGNITO_JDPALK_CLIENT_ID/SECRET` y `COGNITO_JDPALK_HOSTED_UI_DOMAIN`
   (`https://us-east-256x8jf6jr.auth.us-east-2.amazoncognito.com`) completados. Falta solo
   probar el login end-to-end contra este cliente con un usuario real del pool.

   ⚠️ Al ser un cliente **compartido** con otra app, cualquier rotación futura del
   `client_secret` o cambio de sus Callback/Logout URLs afecta a ambas.

2. **Crear el App Client M2M de FuelHub Cloud** — sigue pendiente (sección 2.3): tipo
   "back-office", `custom:station_scope = "*"`, scopes `fuelhub-api/cierres.read` +
   `fuelhub-api/cierres.write` → llena `FUELHUB_TOKEN_URL`, `FUELHUB_M2M_CLIENT_ID`,
   `FUELHUB_M2M_CLIENT_SECRET` en `.env.local`. Es 100% configuración de Cognito, sin cambios
   de código (igual que se hizo para `notificaciones-whatsapp`). Avísame cuando quieras armarlo.

3. **Reemplazar el catálogo de productos placeholder**
   (`CATALOGO_PRODUCTOS_PLACEHOLDER` en `lib/fuelhub/types.ts`) por los `productoId`/nombre
   reales de `productos_maestro` — este documento de spec no trae ese listado exacto.

4. **Definir el mapeo rol → permiso** (sección 9, ej. "solo ADMIN anula"). Hoy
   `lib/permissions.ts` → `canAnularCompra()` es permisivo a propósito (deja anular a cualquier
   persona logueada) para no bloquear el desarrollo. Es el único lugar que hay que tocar cuando
   definas la regla real.

5. **Confirmar el shape exacto de `Tanque` y `DestinoOutput`** contra `openapi.yaml` — se
   modelaron con los campos mínimos mencionados en la spec de frontend; puede que la API real
   traiga más campos útiles para el selector (p. ej. nombre del tanque, producto asignado).

6. **Filtro de fechas en Compras solo cubre `fecha` (comprobante), no `creadoEn` (registro)**
   (ver TODO en `components/ComprasFilters.tsx`). `GET /compras` de FuelHub Cloud no soporta
   filtrar por fecha de registro — ignora en silencio cualquier parámetro que no sea
   `fechaDesde`/`fechaHasta` sobre `fecha` (confirmado el 2026-09-26). Falta que `fuelhub-core`
   agregue soporte real (ej. `creadoDesde`/`creadoHasta`) antes de poder corregir el filtro acá.

## Cómo correrlo

```bash
npm install
cp .env.example .env.local   # y completa los valores (ver tabla de arriba)
npm run dev
```

**Importante sobre `npm install`**: igual que le pasó a `notificaciones-whatsapp` con `esbuild`,
Next.js instala un binario nativo específico de la plataforma (`@next/swc-*`). Corre `npm
install` en el mismo sistema operativo donde vas a correr `npm run dev` — en tu caso, directo en
tu PowerShell/cmd de Windows, no dentro de un contenedor Linux — para evitar el mismo error de
"subprocess exited" que tuvimos antes.

## Estructura

```
app/
  api/
    auth/[...nextauth]/route.ts   # login de persona (NextAuth + Cognito Hosted UI)
    compras/route.ts              # GET listado, POST crear
    compras/[id]/route.ts         # GET detalle, PUT editar/anular
    tanques/route.ts              # GET selector de tanques (todas las estaciones)
  compras/
    page.tsx                      # listado (server component)
    nuevo/page.tsx                # crear
    [id]/page.tsx                 # detalle/editar
  layout.tsx, page.tsx, globals.css
components/
  ComprasFilters.tsx, Pagination.tsx, EstadoBadge.tsx, ErrorBanner.tsx
  CompraForm.tsx                  # formulario único crear/editar
  DestinosEditor.tsx              # reparto a tanques, cualquier estación
  AnularCompraButton.tsx
lib/
  auth.ts, session.ts             # sesión de persona (FuelWeb)
  permissions.ts                  # mapeo rol → permiso (placeholder, ver punto 3 arriba)
  format.ts                       # fechas/moneda en hora de Lima
  apiRouteHelpers.ts              # sesión + passthrough de errores en las rutas de API
  fuelhub/
    m2mToken.ts                   # sesión M2M cacheada hacia FuelHub Cloud
    client.ts                     # fetch con retry 503 + errores uniformes
    compras.ts                    # funciones de dominio (listar/obtener/crear/actualizar)
    types.ts                      # tipos espejo del contrato de FuelHub Cloud
middleware.ts                     # protege /compras y /api/compras detrás del login
```

## Siguientes módulos (fuera de esta pasada)

- Cierres de turno / cierres de día (secciones 3.2/3.3) — solo lectura, sin bloqueos.
- Reportes de margen, abastecimiento y del día (sección 3.4) — solo lectura, sin bloqueos.
- Reporte de mermas (sección 3.5) — bloqueado hasta que exista `GET /reportes/mermas` en
  FuelHub Cloud (sección 8.3, "⏳ pendiente" en la spec).
