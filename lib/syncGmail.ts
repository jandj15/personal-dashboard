import type { SupabaseClient } from "@supabase/supabase-js";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { dayOffsetInTz } from "./dates";

// Mirrors the most recent UNREAD Gmail messages into the `inbox` table
// (source='gmail') via IMAP + an app password, and updates the unread total.
// Manual/seed rows (source='manual') are left untouched.

const MAX_MESSAGES = 6;

export function gmailConfigured(): boolean {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

function initialsFrom(name: string, address: string): string {
  const src = name.trim() || address;
  const words = src.replace(/[^\p{L}\p{N} ]/gu, " ").trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (address.slice(0, 2) || "··").toUpperCase();
}

function relLabel(d: Date, now: Date): string {
  const diff = now.getTime() - d.getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24 && dayOffsetInTz(d, now) === 0) return `hace ${h}h`;
  const off = dayOffsetInTz(d, now);
  if (off === -1) return "ayer";
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", timeZone: "Europe/Madrid" });
}

interface InboxInsert {
  from_name: string;
  initials: string;
  subject: string;
  preview: string;
  when_label: string;
  replyable: boolean;
  sort_order: number;
  source: string;
  ext_id: string;
}

export async function syncGmail(sb: SupabaseClient): Promise<{ count: number; unread: number }> {
  const user = process.env.GMAIL_USER as string;
  const pass = process.env.GMAIL_APP_PASSWORD as string;
  if (!user || !pass) return { count: 0, unread: 0 };

  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false,
    socketTimeout: 20_000,
    greetingTimeout: 10_000,
  });

  const now = new Date();
  const rows: InboxInsert[] = [];
  let unread = 0;

  await client.connect();
  const lock = await client.getMailboxLock("INBOX");
  try {
    const unseen = (await client.search({ seen: false }, { uid: true })) || [];
    unread = unseen.length;

    // Most recent unread first.
    const take = unseen.slice(-MAX_MESSAGES).reverse();
    let i = 0;
    for (const uid of take) {
      const msg = await client.fetchOne(
        String(uid),
        { uid: true, envelope: true, internalDate: true, source: true },
        { uid: true }
      );
      if (!msg || !msg.envelope) continue;

      const fromAddr = msg.envelope.from?.[0];
      const name = fromAddr?.name?.trim() || "";
      const address = fromAddr?.address || "";
      const when = msg.internalDate ? new Date(msg.internalDate) : now;

      let preview = "";
      try {
        if (msg.source) {
          const parsed = await simpleParser(msg.source);
          preview = (parsed.text || "").replace(/\s+/g, " ").trim().slice(0, 140);
        }
      } catch {
        preview = "";
      }

      rows.push({
        from_name: name || address || "(desconocido)",
        initials: initialsFrom(name, address),
        subject: msg.envelope.subject?.trim() || "(sin asunto)",
        preview,
        when_label: relLabel(when, now),
        replyable: false,
        sort_order: i++,
        source: "gmail",
        ext_id: String(uid),
      });
    }
  } finally {
    lock.release();
    await client.logout().catch(() => {});
  }

  const { error: delErr } = await sb.from("inbox").delete().eq("source", "gmail");
  if (delErr) throw new Error(delErr.message);
  if (rows.length) {
    const { error: insErr } = await sb.from("inbox").insert(rows);
    if (insErr) throw new Error(insErr.message);
  }
  // Reflect the real unread count in the header badge.
  await sb.from("settings").update({ inbox_unread_total: unread }).eq("id", "default");

  return { count: rows.length, unread };
}
