import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { interpret } from "@/lib/claude";
import { transcribe } from "@/lib/transcribe";
import { applyTool } from "@/lib/applyTools";
import { fmtLongDate } from "@/lib/format";
import { safeEqual } from "@/lib/auth";
import { loadHistory, saveMessage, clearHistory, loadFacts } from "@/lib/botMemory";

export const runtime = "nodejs";
// Claude may call several tools per message; give the function time to finish.
export const maxDuration = 60;

const TG_MAX_LEN = 4096; // Telegram's message length limit

async function reply(chatId: number, text: string) {
  for (let i = 0; i < text.length || i === 0; i += TG_MAX_LEN) {
    await tg("sendMessage", { chat_id: chatId, text: text.slice(i, i + TG_MAX_LEN) });
  }
}

const HELP = `¡Hola! Soy tu asistente. Puedes escribirme o mandarme notas de voz.

Ejemplos:
• "añade tarea urgente: llamar al banco mañana"
• "¿qué tengo hoy?"
• "apunta la cena: pollo con arroz"
• "recuerda que soy alérgico a los frutos secos"
• o pregúntame lo que quieras

Comandos:
/olvidar — borra la conversación reciente (no los datos recordados)`;

const TG = "https://api.telegram.org";

async function tg(method: string, payload: unknown) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  return fetch(`${TG}/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function downloadVoice(fileId: string): Promise<ArrayBuffer> {
  const token = process.env.TELEGRAM_BOT_TOKEN as string;
  const res = await fetch(`${TG}/bot${token}/getFile?file_id=${fileId}`);
  const json = (await res.json()) as { ok: boolean; result?: { file_path: string } };
  if (!json.ok || !json.result) throw new Error("getFile failed");
  const fileRes = await fetch(`${TG}/file/bot${token}/${json.result.file_path}`);
  return fileRes.arrayBuffer();
}

interface TgMessage {
  chat?: { id: number };
  text?: string;
  voice?: { file_id: string };
}

export async function POST(req: Request) {
  // 1. Verify Telegram's secret-token header (if configured).
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret) {
    const got = req.headers.get("x-telegram-bot-api-secret-token");
    if (!safeEqual(got ?? "", secret)) {
      return NextResponse.json({ ok: false, error: "bad secret" }, { status: 401 });
    }
  }

  let update: { message?: TgMessage };
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const message = update.message;
  const chatId = message?.chat?.id;
  if (!message || chatId === undefined) return NextResponse.json({ ok: true });

  // 2. Single-user lock: ignore everyone except the owner.
  const owner = process.env.OWNER_TELEGRAM_CHAT_ID;
  if (owner && String(chatId) !== String(owner)) {
    return NextResponse.json({ ok: true });
  }

  const sb = getServerSupabase();
  if (!sb) {
    await tg("sendMessage", { chat_id: chatId, text: "⚠️ Supabase no configurado." });
    return NextResponse.json({ ok: true });
  }

  try {
    // 3. Resolve input text (transcribe voice notes).
    let text = message.text?.trim() ?? "";
    if (!text && message.voice) {
      const audio = await downloadVoice(message.voice.file_id);
      text = (await transcribe(audio)).trim();
    }
    if (!text) {
      await tg("sendMessage", { chat_id: chatId, text: "No recibí texto ni voz." });
      return NextResponse.json({ ok: true });
    }

    // Commands.
    const cmd = text.split(/\s|@/)[0].toLowerCase();
    if (cmd === "/start" || cmd === "/ayuda" || cmd === "/help") {
      await reply(chatId, HELP);
      return NextResponse.json({ ok: true });
    }
    if (cmd === "/olvidar" || cmd === "/reset") {
      await clearHistory(sb, chatId);
      await reply(chatId, "Listo, empiezo una conversación nueva. 🧹");
      return NextResponse.json({ ok: true });
    }

    // Tell the user we're working on it (voice + several tools can take a while).
    await tg("sendChatAction", { chat_id: chatId, action: "typing" });

    // 4. Claude interprets (with recent conversation + remembered facts) → applies
    //    tools to Supabase → dashboard picks it up on poll/focus.
    const [history, facts] = await Promise.all([loadHistory(sb, chatId), loadFacts(sb)]);
    const dateStr = fmtLongDate(new Date());
    const result = await interpret(
      text,
      (name, input) => applyTool(sb, name, input),
      { dateStr, history, facts }
    );

    await saveMessage(sb, chatId, "user", text);
    await saveMessage(sb, chatId, "assistant", result.reply);
    await reply(chatId, result.reply);
    return NextResponse.json({ ok: true });
  } catch (e) {
    await tg("sendMessage", {
      chat_id: chatId,
      text: `⚠️ Error: ${(e as Error).message}`,
    });
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, status: "telegram webhook ready" });
}
