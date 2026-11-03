export const dynamic = "force-dynamic";

import { getNotifications } from "@/lib/queries";
import NotificationsClient from "./NotificationsClient";

// App-shell tab 4 + Phase 3: the town's notification stream (DB-backed).
export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const { kind } = await searchParams;
  const rows = await getNotifications(60);
  const activeKind = kind && rows.some((r) => r.kind === kind) ? kind : null;
  const shown = activeKind ? rows.filter((r) => r.kind === activeKind) : rows;
  const kinds = [...new Set(rows.map((r) => r.kind))];
  return (
    <main className="dds-simple-page">
      <div className="dds-page-head">
        <h1>Notifications</h1>
      </div>
      <NotificationsClient
        items={shown.map((n) => ({ id: String(n.id), text: n.text, href: n.href, kind: n.kind, tick: n.tick, read: n.read }))}
        kinds={kinds}
        activeKind={activeKind}
        allIds={rows.map((n) => String(n.id))}
      />
    </main>
  );
}
