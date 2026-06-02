# Phase 2 — Telegram voice → Claude → dashboard

**Status: implemented.** Code is wired; it needs real API keys + a Supabase project +
webhook registration to run end-to-end.

## Pipeline (implemented)

```
Telegram voice note (OGG/Opus) or text
   │  webhook POST /api/telegram          app/api/telegram/route.ts
   ▼
verify X-Telegram-Bot-Api-Secret-Token == TELEGRAM_WEBHOOK_SECRET   → 401 if bad
   │
ignore unless message.chat.id == OWNER_TELEGRAM_CHAT_ID            (single-user lock)
   │
voice? getFile → download OGG → lib/transcribe.ts (OpenAI whisper-1, es) → text
text?  use as-is
   ▼
lib/claude.ts  interpret(text, executeTool)   Claude tool-use loop, prompt-cached
   │   tools: add_task, complete_task, add_event, log_meal, set_water, update_movement
   ▼
lib/applyTools.ts  applyTool(sb, name, input)   service-role Supabase writes
   ▼
Supabase write  →  open dashboard refetches GET /api/data (poll ~20s / tab focus)
   ▼
Telegram sendMessage(reply)   "tarea añadida: …"
```

The dashboard refreshes by polling `/api/data` (~20s) + on tab focus + after each Google
sync, so bot changes appear within a few seconds (no Realtime, no manual refresh).

## Files

- `app/api/telegram/route.ts` — webhook (nodejs runtime), guards, voice download, orchestration.
- `lib/transcribe.ts` — OpenAI Whisper (`whisper-1`, `language: "es"`).
- `lib/claude.ts` — `interpret()` manual tool-use loop, model `claude-sonnet-4-6` (adaptive
  thinking, system+tools prompt-cached). Override with `CLAUDE_MODEL`.
- `lib/applyTools.ts` — tool → Supabase write mapping.

## Setup to go live

1. Create the Supabase project and apply `supabase/migrations/0001_init.sql` + `seed.sql`.
2. Create a Telegram bot via **@BotFather**, get `TELEGRAM_BOT_TOKEN`.
3. Set env (locally in `.env.local`, on Vercel in project settings):
   ```
   ANTHROPIC_API_KEY=...
   OPENAI_API_KEY=...
   TELEGRAM_BOT_TOKEN=...
   TELEGRAM_WEBHOOK_SECRET=<random string>
   OWNER_TELEGRAM_CHAT_ID=<your chat id>
   # CLAUDE_MODEL=claude-opus-4-8   (optional)
   ```
   Plus the Supabase keys (incl. `SUPABASE_SERVICE_ROLE_KEY` — the webhook writes with it).
4. Find your chat id: message the bot, then GET `https://api.telegram.org/bot<token>/getUpdates`.
5. Register the webhook (after deploy):
   ```bash
   curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
     -d "url=https://<your-app>.vercel.app/api/telegram" \
     -d "secret_token=$TELEGRAM_WEBHOOK_SECRET" \
     -d "allowed_updates=[\"message\"]"
   ```
6. Send the bot a voice note: *"añade tarea urgente llamar al banco mañana"*,
   *"apunta la cena, pollo con arroz, 600 calorías"*, *"marca como hecha la propuesta de Aurora"*,
   *"he bebido un litro y medio de agua"*, *"hoy he dado 9000 pasos"*. The dashboard updates live.

## Verified locally (without keys)

- `GET /api/telegram` → ready.
- POST without / wrong `x-telegram-bot-api-secret-token` → **401**.
- POST with valid secret but non-owner `chat.id` → **200, ignored**.
- POST as owner with no API keys → **200**, error caught gracefully.

## Tool → table map

| tool             | table                 | op                                                     |
|------------------|-----------------------|--------------------------------------------------------|
| add_task         | tasks                 | insert                                                 |
| complete_task    | tasks                 | update done=true (fuzzy ilike title match)             |
| add_event        | events                | insert (day_offset relative to today)                  |
| log_meal         | meals + nutrition_log | insert meal (today) + accumulate estimated macros      |
| set_macros       | nutrition_log         | set today's total macros (absolute)                    |
| set_water        | nutrition_log         | upsert today's water_l                                  |
| update_movement  | movement              | upsert today's metrics                                  |

Daily tables (`meals.logged_on`, `movement.day`, `nutrition_log.day`) are scoped to
today in `APP_TZ` (Europe/Madrid) and reset at local midnight; goals stay constant.
