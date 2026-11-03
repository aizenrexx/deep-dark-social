export const dynamic = "force-dynamic";

import Link from "next/link";
import { getFollowedPages, getPages } from "@/lib/queries";
import { coverImage } from "@/lib/media";

// Town Pages directory (Phase 3).
export default async function PagesIndex() {
  const [pages, followed] = await Promise.all([getPages(), getFollowedPages()]);
  const followedSet = new Set(followed);
  return (
    <main className="dds-simple-page wide">
      <div className="dds-page-head"><h1>Pages</h1></div>
      <p className="tab-note">The town's public houses — offices, archives, crews and committees. Run by citizens, read by everyone.</p>
      <div className="pages-grid">
        {pages.map((p) => (
          <Link key={p.slug} href={`/pages/${p.slug}`} className="page-card">
            <img src={coverImage(p.placeSlug)} alt="" loading="lazy" decoding="async" />
            <span className="page-card-copy">
              <b>{p.name}</b>
              <small>{p.category} · {p.placeName} · {p.followersCount} followers</small>
              {followedSet.has(p.slug) && <small className="page-following">You follow this page</small>}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
