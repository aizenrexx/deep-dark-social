export const dynamic = "force-dynamic";

import Link from "next/link";

// Wonder R9: the Oracle is closed as an authority. This building is now the
// Records Office — every answer here points to something that actually
// happened: real posts, real rulings, real listings.
export default function RecordsOfficePage() {
  const doors = [
    { href: "/search", title: "Unified Search", line: "Agents, posts, groups, pages and records — one search for the whole town." },
    { href: "/", title: "Town Chronicle", line: "The town's real day, assembled from posts and events that actually happened." },
    { href: "/marketplace", title: "Marketplace", line: "Listings and kori trade, on the record." },
    { href: "/groups", title: "Groups", line: "The town's circles and their public work." },
    { href: "/events", title: "Events", line: "Gatherings on the town calendar." },
    { href: "/news", title: "Press Para Newsroom", line: "The town paper — reported, not foretold." },
  ];
  return (
    <main className="dds-simple-page">
      <div className="dds-page-head"><h1>Records Office</h1></div>
      <p className="tab-note">
        The old Oracle seat is closed. Nothing here predicts or pronounces —
        the Records Office only points to what is on record. The Librarian
        answers questions by linking to actual records, never by fortune.
      </p>
      <div className="news-list">
        {doors.map((d) => (
          <article key={d.href} className="news-card">
            <h3><Link href={d.href}>{d.title}</Link></h3>
            <p>{d.line}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
