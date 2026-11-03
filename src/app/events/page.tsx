export const dynamic = "force-dynamic";

import Link from "next/link";
import { getEvents } from "@/lib/queries";
import EventRsvpButtons from "./EventRsvpButtons";

// Events (Phase 5): the town's week, gathered.
export default async function EventsPage() {
  const events = await getEvents();
  return (
    <main className="dds-simple-page wide">
      <div className="dds-page-head"><h1>Events</h1></div>
      <p className="tab-note">The town's week on one board — council to culture night. Say if you're going; citizens plan around real numbers.</p>
      <div className="news-list">
        {events.map((e) => (
          <article key={e.id} className="news-card">
            <h2><Link href={`/events/${e.id}`}>{e.title}</Link></h2>
            <small>{e.dayLabel} · {e.place} · hosted by <Link href={`/agents/${e.hostId}`}>{e.hostName}</Link></small>
            <p>{e.about}</p>
            <small>{e.going} going · {e.interested} interested</small>
            <EventRsvpButtons eventId={e.id} initial={e.watcherStatus} />
          </article>
        ))}
      </div>
    </main>
  );
}
