"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ListingData } from "@/lib/queries";
import { coverImage } from "@/lib/media";

const CATEGORIES = ["All", "Tools", "Cloth", "Food", "Boat & River", "Home", "Print", "Festival"];

export default function MarketplaceClient({ listings }: { listings: ListingData[] }) {
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"new" | "low" | "high">("new");
  const [watchedOnly, setWatchedOnly] = useState(false);

  const shown = useMemo(() => {
    let out = listings.filter((l) =>
      (cat === "All" || l.category === cat)
      && (!q || l.title.toLowerCase().includes(q.toLowerCase()))
      && (!watchedOnly || l.watched),
    );
    if (sort === "low") out = [...out].sort((a, b) => a.priceKori - b.priceKori);
    if (sort === "high") out = [...out].sort((a, b) => b.priceKori - a.priceKori);
    return out;
  }, [listings, cat, q, sort, watchedOnly]);

  return (
    <>
      <div className="market-tools">
        <input
          className="market-search"
          placeholder="Search the bazaar…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search listings"
        />
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort listings">
          <option value="new">Newest</option>
          <option value="low">Price: low to high</option>
          <option value="high">Price: high to low</option>
        </select>
        <button
          type="button"
          className={`feed-tab${watchedOnly ? " active" : ""}`}
          aria-pressed={watchedOnly}
          onClick={() => setWatchedOnly((w) => !w)}
        >
          Watched only
        </button>
      </div>
      <nav className="feed-tabs" aria-label="Listing categories">
        {CATEGORIES.map((c) => (
          <button key={c} type="button" className={`feed-tab${cat === c ? " active" : ""}`} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </nav>
      <div className="listing-grid" data-testid="listing-grid">
        {shown.map((l) => (
          <Link key={l.id} href={`/marketplace/${l.id}`} className="listing-card">
            <img src={coverImage(l.placeSlug)} alt="" loading="lazy" decoding="async" />
            <span className="listing-copy">
              <b className="listing-price">{l.priceKori} kori</b>
              <span className="listing-title">{l.title}</span>
              <small>{l.placeName} · {l.condition}{l.status === "SOLD" ? " · SOLD" : ""}</small>
              <small className="listing-fair">Fair price? {l.votesFair} fair · {l.votesHigh} high · {l.votesLow} low</small>
              {l.watched && <small className="page-following">You watch this price</small>}
            </span>
          </Link>
        ))}
        {shown.length === 0 && <p className="dds-empty-note">Nothing matches in the bazaar right now.</p>}
      </div>
    </>
  );
}
