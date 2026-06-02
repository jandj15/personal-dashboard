# Personal Dashboard · D.A.V.I.D

Single-screen "Personal OS" — one dark, fixed-width board aggregating a weekly calendar,
prioritized tasks, inbox, Apple-Fitness-style movement rings, an editable nutrition / meal
logger, and a day timeline. **Next.js 15 (App Router)** + **React 19** + **TypeScript**,
backed by **Supabase** (server-side, service-role; locked RLS), behind a **password gate**,
deployed to **Vercel**. Data flows in from **Google Calendar** (iCal), **Gmail** (IMAP),
**Apple Health** (ingest endpoint), and a **Telegram** voice/text bot (Whisper → Claude).

**[🇬🇧 English](#english) · [🇪🇸 Español](#español)**

---

<a id="english"></a>

## English

### Tech stack
Next.js App Router (SSR + Node API routes) · Supabase Postgres · Anthropic Claude (tool-use)
· OpenAI Whisper (voice) · Vercel.

### Quick start (local, no database)

```bash
npm install
npm run dev
```

Open <http://localhost:3000> → log in (dev password **`dashboard`**, set in `.env.local`).
With no Supabase configured the dashboard renders the bundled **seed data**; the meal logger
works in-memory only. To run **ungated** locally, blank `DASHBOARD_PASSWORD` in `.env.local`.

### Connect Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor run the migrations **in order** — `supabase/migrations/0001` … `0005` —
   then optionally `supabase/seed.sql` for demo data. (CLI: `supabase db reset` after `supabase link`.)
3. Put the keys in `.env.local` — only the URL + **service-role** key are needed:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<service role key>   # REQUIRED, server-only secret
   ```
4. Restart `npm run dev`. The browser **never** talks to Supabase directly — all reads/writes
   go through cookie-gated server routes (`/api/data`, `/api/meals`, `/api/tasks`) using the
   service-role key. The dashboard refreshes by polling (~20s) + on tab focus + after each sync.

The data layer falls back to `lib/defaultData.ts` whenever the service-role key is missing or a
query fails, so the UI always renders.

### Security model

- **Single user, one shared password.** No per-user auth.
- **Locked RLS + service-role only.** `0005_lock_rls.sql` removes every permissive policy, so
  the public anon key reads/writes **nothing**. All access is server-side with the service-role
  key. Keep that key secret (server-only); the anon key is unused by the app.
- **Production fails closed.** If `DASHBOARD_PASSWORD` or `AUTH_SECRET` is missing in production,
  the app returns HTTP 503 instead of running open. Locally, blank them to run ungated.
- **Auth.** HMAC-signed cookie (`pd_auth`, 30-day TTL), constant-time compares, best-effort
  login rate-limit. Generate `AUTH_SECRET` with `openssl rand -hex 32`; use a strong password.
- **CSRF.** State-changing POSTs are `SameSite=Lax` + same-origin checked.
- **Secrets** live only in `.env.local` (gitignored) / Vercel env — never commit them.

### Integrations (all optional)

| Integration | Env vars | Notes |
|---|---|---|
| **Telegram bot** | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `OWNER_TELEGRAM_CHAT_ID`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` | Voice/text → Whisper → Claude tool-use → DB. Full setup in [`docs/PHASE2.md`](docs/PHASE2.md). |
| **Apple Health** | `MOVEMENT_INGEST_SECRET` | An iPhone Shortcut POSTs today's metrics to `/api/movement` with header `x-ingest-secret`. Required in production. |
| **Google Calendar** | `GOOGLE_CALENDAR_ICS_URLS` | One or more **private iCal** URLs (Calendar settings → "Secret address in iCal format"), comma-separated. |
| **Gmail** | `GMAIL_USER`, `GMAIL_APP_PASSWORD` | Recent unread → inbox via IMAP. Needs 2FA + a Google **App Password** (not your login password). |

### Deploy to Vercel

1. Push to GitHub, import the repo in Vercel (Next.js auto-detected).
2. Set environment variables (Project → Settings → Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — **required** (anon key not needed)
   - `DASHBOARD_PASSWORD` (strong) + `AUTH_SECRET` (random) — **required in production**
   - Integrations as needed (table above)
3. **Deploy the code first**, then apply migrations `0001`…`0005` to Supabase. If you are
   migrating an existing live deployment, apply `0005` only **after** the new code is live
   (it locks RLS, which the old browser-anon code depended on).

### Project layout

```
app/            page (SSR), /login, /api/{auth,data,meals,tasks,sync,movement,telegram}
components/     Dashboard + TopBar + Greeting + cards/* (Calendar, Tasks, Inbox, Movement, Nutrition, TimeBar)
lib/            types, defaultData, format, data (server load), supabase/server, auth, http,
                claude, transcribe, syncCalendar, syncGmail, applyTools
supabase/       migrations/0001…0005, seed.sql
middleware.ts   password gate (fail-closed in prod)
docs/PHASE2.md  Telegram + Whisper + Claude pipeline
```

The design's CSS lives verbatim in `app/globals.css`; components reproduce the mockup's DOM/classes and bind live data.

---

<a id="español"></a>

## Español

Panel personal de una sola pantalla ("Personal OS"): calendario semanal, tareas priorizadas,
bandeja de entrada, anillos de actividad estilo Apple Fitness, registro de nutrición/comidas
editable y una línea de tiempo del día. **Next.js 15 (App Router)** + **React 19** +
**TypeScript**, con **Supabase** (en servidor, service-role; RLS bloqueada), tras una **contraseña**,
desplegado en **Vercel**. Los datos entran desde **Google Calendar** (iCal), **Gmail** (IMAP),
**Apple Salud** (endpoint de ingesta) y un bot de **Telegram** por voz/texto (Whisper → Claude).

### Stack
Next.js App Router (SSR + rutas API en Node) · Supabase Postgres · Anthropic Claude (tool-use)
· OpenAI Whisper (voz) · Vercel.

### Inicio rápido (local, sin base de datos)

```bash
npm install
npm run dev
```

Abre <http://localhost:3000> → inicia sesión (contraseña de desarrollo **`dashboard`**, en
`.env.local`). Sin Supabase configurado, el panel muestra los **datos de ejemplo**; el registro
de comidas funciona solo en memoria. Para ejecutarlo **sin contraseña** en local, deja vacío
`DASHBOARD_PASSWORD` en `.env.local`.

### Conectar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En el editor SQL ejecuta las migraciones **en orden** — `supabase/migrations/0001` … `0005` —
   y luego, opcionalmente, `supabase/seed.sql` para datos de ejemplo. (CLI: `supabase db reset`
   tras `supabase link`.)
3. Pon las claves en `.env.local` — solo se necesitan la URL + la clave **service-role**:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<clave service role>   # OBLIGATORIA, secreta y solo de servidor
   ```
4. Reinicia `npm run dev`. El navegador **nunca** habla con Supabase directamente: todas las
   lecturas/escrituras pasan por rutas de servidor protegidas por cookie (`/api/data`,
   `/api/meals`, `/api/tasks`) usando la clave service-role. El panel se actualiza por sondeo
   (~20s) + al enfocar la pestaña + tras cada sincronización.

La capa de datos recurre a `lib/defaultData.ts` si falta la clave service-role o falla una
consulta, así la interfaz siempre se renderiza.

### Modelo de seguridad

- **Un solo usuario, una contraseña compartida.** Sin autenticación por usuario.
- **RLS bloqueada + solo service-role.** `0005_lock_rls.sql` elimina toda política permisiva,
  así la clave anónima pública **no lee ni escribe nada**. Todo el acceso es de servidor con la
  clave service-role. Mantén esa clave en secreto; la app no usa la clave anónima.
- **En producción falla en cerrado.** Si falta `DASHBOARD_PASSWORD` o `AUTH_SECRET` en
  producción, la app devuelve HTTP 503 en vez de quedar abierta. En local, déjalas vacías para
  ejecutar sin contraseña.
- **Autenticación.** Cookie firmada con HMAC (`pd_auth`, 30 días), comparaciones de tiempo
  constante, límite de intentos de login (best-effort). Genera `AUTH_SECRET` con
  `openssl rand -hex 32`; usa una contraseña fuerte.
- **CSRF.** Los POST que modifican datos son `SameSite=Lax` + verificación de mismo origen.
- **Los secretos** viven solo en `.env.local` (ignorado por git) / variables de Vercel — nunca
  los subas al repositorio.

### Integraciones (todas opcionales)

| Integración | Variables de entorno | Notas |
|---|---|---|
| **Bot de Telegram** | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `OWNER_TELEGRAM_CHAT_ID`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` | Voz/texto → Whisper → Claude (tool-use) → BD. Guía completa en [`docs/PHASE2.md`](docs/PHASE2.md). |
| **Apple Salud** | `MOVEMENT_INGEST_SECRET` | Un Atajo de iPhone envía las métricas del día por POST a `/api/movement` con la cabecera `x-ingest-secret`. Obligatoria en producción. |
| **Google Calendar** | `GOOGLE_CALENDAR_ICS_URLS` | Una o varias URL **iCal privadas** (Ajustes del calendario → "Dirección secreta en formato iCal"), separadas por comas. |
| **Gmail** | `GMAIL_USER`, `GMAIL_APP_PASSWORD` | Correos no leídos recientes → bandeja vía IMAP. Requiere 2FA + una **contraseña de aplicación** de Google (no tu contraseña normal). |

### Desplegar en Vercel

1. Sube a GitHub e importa el repo en Vercel (detecta Next.js automáticamente).
2. Configura las variables de entorno (Proyecto → Settings → Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — **obligatorias** (la anónima no hace falta)
   - `DASHBOARD_PASSWORD` (fuerte) + `AUTH_SECRET` (aleatoria) — **obligatorias en producción**
   - Integraciones según necesites (tabla anterior)
3. **Despliega el código primero** y luego aplica las migraciones `0001`…`0005` en Supabase. Si
   migras un despliegue ya en producción, aplica `0005` **solo después** de que el nuevo código
   esté activo (bloquea la RLS, de la que dependía el código antiguo basado en la clave anónima).

### Estructura del proyecto

```
app/            página (SSR), /login, /api/{auth,data,meals,tasks,sync,movement,telegram}
components/     Dashboard + TopBar + Greeting + cards/* (Calendar, Tasks, Inbox, Movement, Nutrition, TimeBar)
lib/            types, defaultData, format, data (carga en servidor), supabase/server, auth, http,
                claude, transcribe, syncCalendar, syncGmail, applyTools
supabase/       migrations/0001…0005, seed.sql
middleware.ts   contraseña (falla en cerrado en producción)
docs/PHASE2.md  pipeline de Telegram + Whisper + Claude
```

El CSS del diseño está literal en `app/globals.css`; los componentes reproducen el DOM/clases
del mockup y enlazan datos en vivo.
