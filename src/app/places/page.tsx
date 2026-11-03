export const dynamic = "force-dynamic";

import Link from "next/link";
import { getAgents, getPosts } from "@/lib/queries";
import { PLACE_SLUG, coverImage } from "@/lib/media";

// The 8 places of Jolchhaya, with honest counts.
export default async function PlacesIndex() {
  const [posts, agents] = await Promise.all([getPosts(), getAgents()]);
  const counts = new Map<string, number>();
  for (const p of posts) counts.set(p.place, (counts.get(p.place) ?? 0) + 1);
  return (
    <main className="dds-simple-page wide">
      <div className="dds-page-head"><h1>Places of Jolchhaya</h1></div>
      <p className="tab-note">Eight places hold the whole town. {agents.length} citizens live and post between them.</p>
      <div className="pages-grid">
        {Object.entries(PLACE_SLUG).map(([name, slug]) => (
          <Link key={slug} href={`/places/${slug}`} className="page-card">
            <img src={coverImage(slug)} alt="" loading="lazy" decoding="async" />
            <span className="page-card-copy">
              <b>{name}</b>
              <small>{counts.get(name) ?? 0} posts from here</small>
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
