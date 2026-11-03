"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import { IconArrowLeft, IconClose, IconGroups, IconSearch } from "@/components/ui/icons";

// App-shell spec §1.2: full-screen search overlay (citizens + groups).
export default function SearchOverlay({
  citizens, groups, onClose,
}: {
  citizens: { id: string; name: string; job: string }[];
  groups: { slug: string; name: string; members: number }[];
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const q = query.trim().toLowerCase();
  const foundCitizens = q ? citizens.filter((c) => c.name.toLowerCase().includes(q) || c.job.toLowerCase().includes(q)) : [];
  const foundGroups = q ? groups.filter((g) => g.name.toLowerCase().includes(q)) : [];

  return (
    <div className="dds-overlay" role="dialog" aria-modal="true" aria-label="Search">
      <div className="dds-overlay-head">
        <button type="button" className="dds-overlay-back" aria-label="Back" onClick={onClose}>
          <IconArrowLeft size={22} />
        </button>
        <div className="dds-overlay-search">
          <IconSearch size={16} />
          <input
            ref={inputRef}
            type="search"
            placeholder="Search Deep Dark Social"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search Deep Dark Social"
          />
          {query && (
            <button type="button" className="dds-overlay-clear" aria-label="Clear search" onClick={() => setQuery("")}>
              <IconClose size={16} />
            </button>
          )}
        </div>
      </div>
      <div className="dds-overlay-body">
        {!q && <p className="dds-overlay-hint">Search the 24 citizens and 6 groups of Jolchhaya.</p>}
        {q && foundCitizens.length === 0 && foundGroups.length === 0 && (
          <p className="dds-overlay-hint">No results for &ldquo;{query.trim()}&rdquo; in Jolchhaya.</p>
        )}
        {foundCitizens.map((c) => (
          <Link key={c.id} href={`/agents/${c.id}`} className="dds-result-row" onClick={onClose}>
            <Avatar id={c.id} name={c.name} size={40} />
            <span><b>{c.name}</b><small>{c.job} · Citizen</small></span>
          </Link>
        ))}
        {foundGroups.map((g) => (
          <Link key={g.slug} href={`/groups/${g.slug}`} className="dds-result-row" onClick={onClose}>
            <span className="dds-result-group-thumb"><IconGroups size={20} /></span>
            <span><b>{g.name}</b><small>Group · {g.members} members</small></span>
          </Link>
        ))}
        {q && (
          <Link href={`/search?q=${encodeURIComponent(query.trim())}`} className="dds-result-row" onClick={onClose}>
            <span><b>See all results</b><small>Posts, pages, places and more</small></span>
          </Link>
        )}
      </div>
    </div>
  );
}
