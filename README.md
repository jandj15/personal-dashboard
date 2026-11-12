# Personal Dashboard · D.A.V.I.D

A private, single-screen "personal command center": your week's calendar, to-dos, inbox,
activity rings, and nutrition on one dark board — that **you** host, for yourself. Optional
extras let a Telegram voice note, your Google Calendar/Gmail, and Apple Health feed it.

This guide is written for **non-technical** people. No coding — you'll create three free
accounts, copy-paste a few times, and click **Deploy**. About **15–20 minutes**.

> **Two ways to set this up:**
> **(A) No coding — recommended.** Follow the steps below: copy the project, set up the
> database, and deploy in the browser. You never open a terminal.
> **(B) Developers (advanced).** Run it on your own machine — this **requires installing
> [Node.js](https://nodejs.org) and [Git](https://git-scm.com)** and cloning the repo first.
> Typing `npm install` on its own does nothing useful until you've done that — see
> [*For developers*](#for-developers--run-on-your-own-computer-advanced) at the end.

**[🇬🇧 English](#english) · [🇪🇸 Español](#español)**

---

<a id="english"></a>

## English

### What you'll need (all free)

- A **GitHub** account — to keep your own copy of the project.
- A **Supabase** account — the database that stores your data.
- A **Vercel** account — hosts your website.

You can sign into Supabase and Vercel *with* your GitHub account, so it's quick.

### Step 1 — Get your own copy (GitHub)

1. Open the project: **<https://github.com/imperiaAI/personal-dashboard>**
2. Click **Fork** (top-right) → **Create fork**. You now have your own copy under your account.

### Step 2 — Create the database (Supabase)

1. Go to **[supabase.com](https://supabase.com)** → **New project**. Pick a name and a database
   password (save it somewhere), choose the nearest region, and create it. Wait ~2 minutes.
2. In the left sidebar open **SQL Editor** → **New query**.
3. In your forked GitHub copy, open the folder **`supabase/migrations`**. There are 6 files
   (`0001…` to `0006…`). **For each file, in order:** open it on GitHub, copy all the text,
   paste it into the Supabase SQL editor, and click **Run**. Repeat for all 6.
4. *(Optional)* Do the same once more with **`supabase/seed.sql`** to load example data.
5. Left sidebar → **Project Settings → API**. Copy these two values (you'll paste them in Step 3):
   - **Project URL** — looks like `https://abcd1234.supabase.co`
   - **`service_role` key** — under *Project API keys*, click to reveal. **Keep this secret.**

### Step 3 — Put it online (Vercel)

**Easiest — one click.** This button copies the project and walks you through the settings:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/imperiaAI/personal-dashboard&env=NEXT_PUBLIC_SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY,DASHBOARD_PASSWORD,AUTH_SECRET&envDescription=Supabase%20URL%20%2B%20service-role%20key%2C%20a%20login%20password%2C%20and%20a%20long%20random%20secret&project-name=personal-dashboard&repository-name=personal-dashboard)

*(Or manually: [vercel.com](https://vercel.com) → **Add New → Project** → **Import** your forked repo.)*

When Vercel asks for **Environment Variables**, add these **four**:

| Name | What to paste |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | the **Project URL** from Step 2 |
| `SUPABASE_SERVICE_ROLE_KEY` | the **service_role** key from Step 2 (secret) |
| `DASHBOARD_PASSWORD` | any password you'll type to log in |
| `AUTH_SECRET` | a long random string — 30+ characters (use a password generator, or just mash the keyboard) |

Click **Deploy** and wait ~1–2 minutes.

### Step 4 — Open it and log in

1. Vercel shows your site address (ends in `.vercel.app`). Open it.
2. Enter the **`DASHBOARD_PASSWORD`** you chose. You're in. ✅

### Test that it works

- **Nutrición** card → **+ Añadir**, type a food name and calories → reload the page; it's still
  there (saved in your database).
- **Tareas** card → click a task's checkbox → it gets marked done.
- An empty calendar/inbox is normal until you connect Google (optional, below).

### Optional add-ons

The dashboard already works without these. To turn one on, add its Environment Variables in
Vercel (**Project → Settings → Environment Variables**) and click **Redeploy**.

| Add-on | What it does | Variables to add |
|---|---|---|
| **Telegram voice bot** | Talk/type to a bot to update the board | `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `OWNER_TELEGRAM_CHAT_ID` — full guide in [`docs/PHASE2.md`](docs/PHASE2.md) |
| **Apple Health** | Steps / activity from your iPhone | `MOVEMENT_INGEST_SECRET` + an iPhone Shortcut — step-by-step in [`docs/apple-health.md`](docs/apple-health.md) |
| **Google Calendar** | Your real events | `GOOGLE_CALENDAR_ICS_URLS` (your calendar's "Secret address in iCal format") |
| **Gmail** | Recent unread emails in the inbox card | `GMAIL_USER`, `GMAIL_APP_PASSWORD` (a Google *App Password*, not your login) |

### If something looks off

- **Only example data shows** → a Supabase variable is missing or mistyped. Re-check Step 3, then **Redeploy**.
- **Page says "Auth not configured"** → `DASHBOARD_PASSWORD` or `AUTH_SECRET` isn't set. Add both, **Redeploy**.
- **Calendar/inbox empty** → normal until you connect Google (optional).

### Keep your secrets safe

Only paste the `service_role` key and your passwords into **Vercel's Environment Variables**.
Never put them in the code or anywhere public. Your forked repo can be public — it contains
no secrets.

### For developers — run on your own computer (advanced)

> Not needed if you used the Vercel steps above. This path is for developers. The commands
> below **only work after** you have installed the prerequisites and cloned the repo — running
> `npm install` by itself, without Node.js + the cloned project, will do nothing.

**Prerequisites:** install [Node.js](https://nodejs.org) 18+ and [Git](https://git-scm.com).

```bash
# 1. Clone YOUR fork (replace YOUR-USERNAME), then enter the folder
git clone https://github.com/YOUR-USERNAME/personal-dashboard.git
cd personal-dashboard

# 2. Install dependencies (needs Node.js from the prerequisites)
npm install

# 3. Configure: copy the example env file, then edit .env.local
cp .env.example .env.local

# 4. Run it
npm run dev        # open http://localhost:3000
```

With no Supabase configured it shows example data and the meal logger is in-memory only.
Architecture/security notes are in [`docs/PHASE2.md`](docs/PHASE2.md) and the migration files.

---

<a id="español"></a>

## Español

Un "centro de mando personal" privado de una sola pantalla: el calendario de tu semana, tareas,
correo, anillos de actividad y nutrición en un único panel oscuro — que **tú** alojas, para ti.
Extras opcionales permiten que una nota de voz de Telegram, tu Google Calendar/Gmail y Apple
Salud lo alimenten.

Esta guía es para personas **sin conocimientos técnicos**. Sin programar: crearás tres cuentas
gratuitas, copiarás y pegarás unas cuantas veces, y pulsarás **Deploy**. Unos **15–20 minutos**.

> **Dos formas de configurarlo:**
> **(A) Sin programar — recomendado.** Sigue los pasos de abajo: copia el proyecto, crea la
> base de datos y despliega desde el navegador. Nunca abres una terminal.
> **(B) Desarrolladores (avanzado).** Ejecútalo en tu propio equipo — **requiere instalar
> [Node.js](https://nodejs.org) y [Git](https://git-scm.com)** y clonar el repo primero.
> Escribir `npm install` por sí solo no hace nada hasta haber hecho eso — ver
> [*Para desarrolladores*](#para-desarrolladores--ejecutar-en-tu-ordenador-avanzado) al final.

### Qué necesitas (todo gratis)

- Una cuenta de **GitHub** — para guardar tu propia copia del proyecto.
- Una cuenta de **Supabase** — la base de datos que guarda tus datos.
- Una cuenta de **Vercel** — aloja tu web.

Puedes entrar en Supabase y Vercel *con* tu cuenta de GitHub, así es más rápido.

### Paso 1 — Consigue tu copia (GitHub)

1. Abre el proyecto: **<https://github.com/imperiaAI/personal-dashboard>**
2. Pulsa **Fork** (arriba a la derecha) → **Create fork**. Ya tienes tu copia en tu cuenta.

### Paso 2 — Crea la base de datos (Supabase)

1. Entra en **[supabase.com](https://supabase.com)** → **New project**. Elige un nombre y una
   contraseña de base de datos (guárdala), la región más cercana, y créalo. Espera ~2 minutos.
2. En la barra lateral abre **SQL Editor** → **New query**.
3. En tu copia de GitHub, abre la carpeta **`supabase/migrations`**. Hay 6 archivos
   (`0001…` a `0006…`). **Para cada archivo, en orden:** ábrelo en GitHub, copia todo el texto,
   pégalo en el editor SQL de Supabase y pulsa **Run**. Repite con los 6.
4. *(Opcional)* Haz lo mismo una vez más con **`supabase/seed.sql`** para cargar datos de ejemplo.
5. Barra lateral → **Project Settings → API**. Copia estos dos valores (los pegarás en el Paso 3):
   - **Project URL** — algo como `https://abcd1234.supabase.co`
   - **clave `service_role`** — en *Project API keys*, pulsa para revelarla. **Mantenla en secreto.**

### Paso 3 — Ponlo online (Vercel)

**Lo más fácil — un clic.** Este botón copia el proyecto y te guía por los ajustes:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/imperiaAI/personal-dashboard&env=NEXT_PUBLIC_SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY,DASHBOARD_PASSWORD,AUTH_SECRET&envDescription=URL%20de%20Supabase%20%2B%20clave%20service-role%2C%20una%20contrase%C3%B1a%20de%20acceso%20y%20un%20secreto%20aleatorio%20largo&project-name=personal-dashboard&repository-name=personal-dashboard)

*(O manualmente: [vercel.com](https://vercel.com) → **Add New → Project** → **Import** tu repo.)*

Cuando Vercel pida las **Environment Variables**, añade estas **cuatro**:

| Nombre | Qué pegar |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | la **Project URL** del Paso 2 |
| `SUPABASE_SERVICE_ROLE_KEY` | la clave **service_role** del Paso 2 (secreta) |
| `DASHBOARD_PASSWORD` | la contraseña que escribirás para entrar |
| `AUTH_SECRET` | una cadena aleatoria larga — 30+ caracteres (usa un generador o aporrea el teclado) |

Pulsa **Deploy** y espera ~1–2 minutos.

### Paso 4 — Ábrelo e inicia sesión

1. Vercel te muestra la dirección de tu web (termina en `.vercel.app`). Ábrela.
2. Escribe la **`DASHBOARD_PASSWORD`** que elegiste. Ya estás dentro. ✅

### Comprueba que funciona

- Tarjeta **Nutrición** → **+ Añadir**, escribe una comida y las calorías → recarga la página;
  sigue ahí (guardada en tu base de datos).
- Tarjeta **Tareas** → pulsa la casilla de una tarea → queda marcada como hecha.
- Que el calendario/bandeja estén vacíos es normal hasta que conectes Google (opcional, abajo).

### Extras opcionales

El panel ya funciona sin esto. Para activar uno, añade sus variables en Vercel
(**Project → Settings → Environment Variables**) y pulsa **Redeploy**.

| Extra | Para qué sirve | Variables a añadir |
|---|---|---|
| **Bot de voz de Telegram** | Hablar/escribir a un bot para actualizar el panel | `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `OWNER_TELEGRAM_CHAT_ID` — guía completa en [`docs/PHASE2.md`](docs/PHASE2.md) |
| **Apple Salud** | Pasos / actividad desde tu iPhone | `MOVEMENT_INGEST_SECRET` + un Atajo de iPhone — paso a paso en [`docs/apple-health.md`](docs/apple-health.md) |
| **Google Calendar** | Tus eventos reales | `GOOGLE_CALENDAR_ICS_URLS` ("Dirección secreta en formato iCal" de tu calendario) |
| **Gmail** | Correos no leídos en la bandeja | `GMAIL_USER`, `GMAIL_APP_PASSWORD` (una *contraseña de aplicación* de Google, no la normal) |

### Si algo se ve raro

- **Solo aparecen datos de ejemplo** → falta o está mal una variable de Supabase. Revisa el Paso 3 y **Redeploy**.
- **Pone "Auth not configured"** → falta `DASHBOARD_PASSWORD` o `AUTH_SECRET`. Añade ambas y **Redeploy**.
- **Calendario/bandeja vacíos** → normal hasta que conectes Google (opcional).

### Mantén tus secretos a salvo

Pega la clave `service_role` y tus contraseñas **solo** en las Environment Variables de Vercel.
Nunca en el código ni en sitios públicos. Tu copia del repo puede ser pública: no contiene secretos.

### Para desarrolladores — ejecutar en tu ordenador (avanzado)

> No hace falta si usaste los pasos de Vercel de arriba. Esta vía es para desarrolladores. Los
> comandos de abajo **solo funcionan tras** instalar los requisitos y clonar el repo — escribir
> `npm install` por sí solo, sin Node.js y el proyecto clonado, no hace nada.

**Requisitos:** instala [Node.js](https://nodejs.org) 18+ y [Git](https://git-scm.com).

```bash
# 1. Clona TU fork (cambia YOUR-USERNAME) y entra en la carpeta
git clone https://github.com/YOUR-USERNAME/personal-dashboard.git
cd personal-dashboard

# 2. Instala las dependencias (necesita Node.js de los requisitos)
npm install

# 3. Configura: copia el archivo de ejemplo y luego edita .env.local
cp .env.example .env.local

# 4. Ejecútalo
npm run dev        # abre http://localhost:3000
```

Sin Supabase configurado muestra datos de ejemplo y el registro de comidas es solo en memoria.
Notas de arquitectura/seguridad en [`docs/PHASE2.md`](docs/PHASE2.md) y en los archivos de migración.
