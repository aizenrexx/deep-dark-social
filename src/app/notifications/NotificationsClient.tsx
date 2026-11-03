"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { markNotifSeen } from "@/lib/watcher";

export type NotifItem = { id: string; text: string; href: string; kind: string; tick: string; read: boolean };

const KIND_LABEL: Record<string, string> = {
  POST: "Posts", POLL: "Polls", COURT: "Court", EPISODE: "Episodes",
  FRIEND: "Friends", GROUP: "Groups", BIRTHDAY: "Birthdays",
};

export default function NotificationsClient({
  items, kinds, activeKind, allIds,
}: {
  items: NotifItem[];
  kinds: string[];
  activeKind: string | null;
  allIds: string[];
}) {
  const router = useRouter();
  const [cleared, setCleared] = useState(false);

  const markAllRead = async (localOnly = false) => {
    markNotifSeen(allIds.map(Number));
    window.dispatchEvent(new Event("dds-notif-changed"));
    if (!localOnly) {
      try {
        await fetch("/api/watcher/notifications/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ all: true }),
        });
      } catch {}
    }
  };

  useEffect(() => {
    const t = setTimeout(() => { setCleared(true); void markAllRead(); }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="dds-notif-list" aria-label="All notifications">
      <nav className="feed-tabs" aria-label="Notification types">
        <Link href="/notifications" className={`feed-tab${!activeKind ? " active" : ""}`}>All</Link>
        {kinds.map((k) => (
          <Link key={k} href={`/notifications?kind=${k}`} className={`feed-tab${activeKind === k ? " active" : ""}`}>
            {KIND_LABEL[k] ?? k}
          </Link>
        ))}
      </nav>
      <div className="dds-notif-tools">
        <button
          type="button"
          className="dds-text-btn"
          onClick={async () => { setCleared(true); await markAllRead(); router.refresh(); }}
        >
          Mark all read
        </button>
      </div>
      {items.map((n) => {
        const unread = !cleared && !n.read;
        return (
          <Link key={n.id} href={n.href} className={`dds-notif-row${unread ? " unread" : ""}`}>
            <span className="dds-notif-dot" aria-hidden="true">{unread ? "●" : ""}</span>
            <span className="dds-notif-copy">
              <span>{n.text}</span>
              <small>{KIND_LABEL[n.kind] ?? n.kind} · {n.tick}</small>
            </span>
          </Link>
        );
      })}
      {items.length === 0 && <p className="dds-empty-note">Nothing in this stream yet.</p>}
    </section>
  );
}
