import type { SupabaseClient } from "@supabase/supabase-js";
import type Anthropic from "@anthropic-ai/sdk";

// Memory for the Telegram assistant (tables from migration 0006).
// - Short-term: the last few messages of the chat, replayed as plain text so the
//   bot can follow the conversation ("y ponla para mañana", "¿y la otra?").
// - Long-term: facts the user explicitly asked it to remember.

/** How many past messages to replay, and how old they may be. */
const HISTORY_LIMIT = Number(process.env.BOT_HISTORY_LIMIT || 20);
const HISTORY_MAX_AGE_H = Number(process.env.BOT_HISTORY_HOURS || 24);

export async function loadHistory(
  sb: SupabaseClient,
  chatId: number
): Promise<Anthropic.MessageParam[]> {
  const since = new Date(Date.now() - HISTORY_MAX_AGE_H * 3_600_000).toISOString();
  const { data, error } = await sb
    .from("bot_messages")
    .select("role,content")
    .eq("chat_id", chatId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);
  if (error || !data) return []; // memory is best-effort: never block a reply

  const rows = data.reverse() as { role: "user" | "assistant"; content: string }[];
  // The API needs the conversation to start with a user turn.
  while (rows.length && rows[0].role !== "user") rows.shift();
  return rows.map((r) => ({ role: r.role, content: r.content }));
}

export async function saveMessage(
  sb: SupabaseClient,
  chatId: number,
  role: "user" | "assistant",
  content: string
): Promise<void> {
  await sb.from("bot_messages").insert({ chat_id: chatId, role, content });
}

export async function clearHistory(sb: SupabaseClient, chatId: number): Promise<void> {
  await sb.from("bot_messages").delete().eq("chat_id", chatId);
}

export async function loadFacts(sb: SupabaseClient): Promise<string[]> {
  const { data, error } = await sb
    .from("bot_facts")
    .select("fact")
    .order("created_at", { ascending: true })
    .limit(100);
  if (error || !data) return [];
  return data.map((r) => String(r.fact));
}
