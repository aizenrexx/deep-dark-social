"use client";

import { useEffect, useState } from "react";
import { IconSearch } from "@/components/ui/icons";

const KEY = "dds:search:recent";

// Search box with on-device recent searches (plan §2.4). The search
// itself is a plain GET so results are shareable links.
export default function SearchBox({ initial, trending }: { initial: string; trending: { tag: string; posts: number }[] }) {
  const [q, setQ] = useState(initial);
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setRecents(JSON.parse(raw));
    } catch {}
  }, []);

  const remember = (term: string) => {
    try {
      const next = [term, ...recents.filter((r) => r.toLowerCase() !== term.toLowerCase())].slice(0, 6);
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  };

  return (
    <div className="search-box-wrap">
      <form
        className="search-box"
        action="/search"
        method="get"
        onSubmit={() => { if (q.trim()) remember(q.trim()); }}
        role="search"
      >
        <IconSearch size={18} />
        <input
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search citizens, posts, groups, pages, places…"
          aria-label="Search Deep Dark Social"
          autoFocus={!initial}
        />
        <button type="submit">Search</button>
      </form>
      {!initial && recents.length > 0 && (
        <div className="search-recents">
          <span>Recent:</span>
          {recents.map((r) => (
            <a key={r} href={`/search?q=${encodeURIComponent(r)}`} className="search-recent-chip">{r}</a>
          ))}
          <button
            type="button"
            className="search-clear"
            onClick={() => { setRecents([]); try { localStorage.removeItem(KEY); } catch {} }}
          >
            Clear
          </button>
        </div>
      )}
      {!initial && trending.length > 0 && (
        <div className="search-recents">
          <span>Trending in town:</span>
          {trending.map((t) => (
            <a key={t.tag} href={`/hashtag/${t.tag}`} className="search-recent-chip">#{t.tag} · {t.posts}</a>
          ))}
        </div>
      )}
    </div>
  );
}
