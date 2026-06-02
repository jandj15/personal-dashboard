"use client";

import type { InboxRow, SettingsRow } from "@/lib/types";

interface Props {
  inbox: InboxRow[];
  settings: SettingsRow;
}

export default function InboxCard({ inbox, settings }: Props) {
  const action = inbox.filter((m) => m.replyable).length;
  const messages = [...inbox].sort((a, b) => a.sort_order - b.sort_order).slice(0, 4);

  return (
    <section className="card" data-cat="inbox" style={{ gridArea: "inbox" }}>
      <div className="card-head">
        <div className="card-title">
          <span className="pill"></span> Bandeja de entrada
        </div>
        <div className="card-actions">
          <span>
            SIN LEER · <b style={{ color: "var(--fg)" }}>{settings.inbox_unread_total}</b>
          </span>
          <span style={{ color: "var(--cat-inbox)" }}>
            ACCIÓN · <b>{action}</b>
          </span>
        </div>
      </div>

      <div className="inbox-list">
        {messages.map((m) => (
          <div className={`mail${m.replyable ? " replyable" : ""}`} key={m.id}>
            <div className="av">{m.initials}</div>
            <div className="body">
              <div className="from">
                <span className="who">{m.from_name}</span>
                <span className="when">{m.when_label}</span>
              </div>
              <div className="subject">{m.subject}</div>
              <div className="preview">{m.preview}</div>
            </div>
            {m.replyable && <div className="flag">RESP</div>}
          </div>
        ))}
      </div>
    </section>
  );
}
