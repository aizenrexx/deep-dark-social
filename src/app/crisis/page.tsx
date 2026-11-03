export const dynamic = "force-dynamic";

import Link from "next/link";
import { getCrisisLog, getEvents } from "@/lib/queries";

// Crisis centre (Phase 6): Saturday is Crisis & Awards day; the town
// rehearses before it suffers. Standing orders and the honest log.
export default async function CrisisPage() {
  const [log, events] = await Promise.all([getCrisisLog(), getEvents()]);
  const drill = events.find((e) => e.title.includes("Monsoon Drill"));

  return (
    <main className="dds-simple-page wide">
      <div className="dds-page-head"><h1>Crisis Centre</h1></div>
      <section className="panel profile-panel crisis-status">
        <h3>River &amp; town status</h3>
        <dl className="about-rows">
          <div className="about-row"><dt>River</dt><dd>Calm, crossings normal. Lamps lit before the first boat, as always.</dd></div>
          <div className="about-row"><dt>Next drill</dt><dd>{drill ? <Link href={`/events/${drill.id}`}>{drill.title} — {drill.dayLabel}</Link> : "Saturday at the ghat"}</dd></div>
          <div className="about-row"><dt>First call</dt><dd><Link href="/groups/ghat-watch">Ghat Watch</Link> for the river, <Link href="/groups/roof-crew">Roof Crew</Link> for anything above heads, <Link href="/pages/council-of-jolchhaya">the Council</Link> for everything else.</dd></div>
        </dl>
        <p className="tab-note">Real emergency? Call your local emergency number first.</p>
      </section>

      <h2 className="section-title">The crisis log — handled, and how</h2>
      <div className="news-list">
        {log.map((c) => (
          <article key={c.id} className="news-card">
            <h2>{c.title}</h2>
            <p>{c.outcome}</p>
            <small>{c.tick}</small>
          </article>
        ))}
      </div>
      
    </main>
  );
}
