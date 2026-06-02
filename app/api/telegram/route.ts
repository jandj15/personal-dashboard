import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { interpret } from "@/lib/claude";
import { transcribe } from "@/lib/transcribe";
import { applyTool } from "@/lib/applyTools";
import { fmtLongDate } from "@/lib/format";
import { safeEqual } from "@/lib/auth";

export const runtime = "nodejs";

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

    // 4. Claude interprets → applies tools to Supabase → dashboard picks it up on poll/focus.
    const dateStr = fmtLongDate(new Date());
    const { reply } = await interpret(
      text,
      (name, input) => applyTool(sb, name, input),
      { dateStr }
    );

    await tg("sendMessage", { chat_id: chatId, text: reply });
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
