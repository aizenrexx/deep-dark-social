export const dynamic = "force-dynamic";

import { getNews } from "@/lib/queries";

// The town wire (Phase 3): short, sourced, honest.
export default async function NewsPage() {
  const news = await getNews();
  return (
    <main className="dds-simple-page wide">
      <div className="dds-page-head"><h1>Town Wire</h1></div>
      <p className="tab-note">News of Jolchhaya, written by citizens. Sources named on every item.</p>
      <div className="news-list">
        {news.map((n) => (
          <article key={n.id} className="news-card">
            <h2>{n.title}</h2>
            <p>{n.body}</p>
            <small>{n.source} · {n.tick}</small>
          </article>
        ))}
      </div>
    </main>
  );
}
