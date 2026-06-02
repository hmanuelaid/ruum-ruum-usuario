# RuumRuum Usuario

Aplicacion web de usuario para solicitar traslados de vehiculos, cargar documentos de identidad, consultar viajes, evidencias, notificaciones, cuenta y soporte.

## Stack

- Next.js App Router
- React
- Supabase Auth, Database y Storage
- Zustand para cache de UI
- ESLint, pruebas estaticas de seguridad y CI con GitHub Actions

## Requisitos

- Node.js 22 recomendado para coincidir con CI
- npm
- Proyecto Supabase con Auth habilitado
- Supabase Storage con bucket privado `documents`

## Variables de entorno

Crea `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
NEXT_PUBLIC_ENABLE_DEMO_DATA=false
```

Notas:

- No se requieren variables de Cloudinary. La dependencia fue retirada porque no hay uso en codigo fuente.
- `NEXT_PUBLIC_ENABLE_DEMO_DATA=true` solo debe usarse para entornos demo controlados.
- No guardes service-role keys en variables expuestas al navegador.

## Instalacion

```bash
npm ci
npm run dev
```

La app local corre en `http://localhost:3000`.

## Supabase

Aplica las migraciones en `supabase/migrations` antes de validar flujos productivos. Las migraciones actuales cubren:

- Estado de identidad de usuario en `app_users`.
- Bucket privado `documents`, paths por usuario, RLS y URLs firmadas de corta vida.
- RPC atomica `create_trip_request` para crear viaje, timeline y pagos.
- RLS para `trips`, `trip_timeline`, `payments`, `vehicles`, `documents`, `notifications` y `support_requests`.
- RPCs autenticadas para perfil, vehiculos, notificaciones y soporte.

El bucket `documents` debe permanecer privado. Los documentos se sirven mediante signed URLs generadas en endpoints autenticados.

## Comandos

```bash
npm run dev             # servidor local
npm run lint            # eslint
npm test                # pruebas estaticas de seguridad
npm run build           # build de produccion
npm run audit:security  # npm audit desde severidad moderada
```

## Seguridad

- Las rutas privadas se protegen en `proxy.ts` con `supabase.auth.getUser()` server-side.
- Supabase Auth es la fuente primaria de sesion; Zustand solo cachea UI.
- El onboarding crea cuentas con Supabase Auth mediante correo y contraseña, sin verificacion SMS ni almacenamiento de contraseñas en el navegador.
- Las solicitudes de viaje se validan en cliente, API y RPC SQL.
- El navegador no calcula ni escribe precios, pagos o pago al conductor.
- Los documentos de identidad no usan URLs publicas.
- `postcss` esta fijado con `overrides` a `8.5.10` para cubrir GHSA-qx2v-qp2m-jg93 mientras Next actualiza su dependencia transitiva.
- No usar `npm audit fix --force` sin revisar el plan: npm puede sugerir downgrades mayores inseguros para este proyecto.

## CI

El workflow `.github/workflows/ci.yml` ejecuta en push a `main`/`master` y en pull requests:

1. `npm ci`
2. `npm run lint`
3. `npm test`
4. `npm run build`
5. `npm run audit:security`

## Checklist antes de despliegue

- Migraciones aplicadas en el ambiente destino.
- RLS habilitado y probado con usuarios distintos.
- Bucket `documents` privado.
- Variables de entorno presentes y sin secretos de servidor expuestos.
- `npm run lint`, `npm test`, `npm run build` y `npm run audit:security` en verde.
- Revisar releases de Next para retirar el override de PostCSS cuando Next actualice su version transitiva.
