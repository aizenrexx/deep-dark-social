"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import {
  IconBell, IconChevronDown, IconClose, IconGroups, IconHome, IconMenuGrid,
  IconPerson, IconPlayRect, IconSearch, IconStore,
} from "@/components/ui/icons";

export type HeaderData = {
  citizens: { id: string; name: string; job: string }[];
  groups: { slug: string; name: string }[];
  notifications: { id: number; text: string; href: string }[];
};

export default function Header({ citizens, groups, notifications }: HeaderData) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchFocus, setSearchFocus] = useState(false);
  const [panel, setPanel] = useState<"menu" | "bell" | "account" | null>(null);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [unread, setUnread] = useState(notifications.length);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setPanel(null);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { setPanel(null); setSearchFocus(false); setMobileSearch(false); } };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, []);

  useEffect(() => { setPanel(null); setMobileSearch(false); }, [pathname]);

  if (pathname.startsWith("/welcome")) return null;

  const isHome = pathname === "/";
  const isGroups = pathname.startsWith("/groups");
  const isProfile = pathname.startsWith("/agents");

  const q = query.trim().toLowerCase();
  const foundCitizens = q ? citizens.filter((c) => c.name.toLowerCase().includes(q) || c.job.toLowerCase().includes(q)).slice(0, 5) : [];
  const foundGroups = q ? groups.filter((g) => g.name.toLowerCase().includes(q)).slice(0, 4) : [];
  const showResults = searchFocus && q.length > 0;

  const closeSearch = () => { setSearchFocus(false); setMobileSearch(false); };

  const resultsList = (
    <>
      {foundCitizens.map((c) => (
        <Link key={c.id} href={`/agents/${c.id}`} className="search-row" onClick={closeSearch}>
          <Avatar id={c.id} name={c.name} size={36} />
          <span><b>{c.name}</b><small>{c.job} · Citizen</small></span>
        </Link>
      ))}
      {foundGroups.map((g) => (
        <Link key={g.slug} href={`/groups/${g.slug}`} className="search-row" onClick={closeSearch}>
          <span className="search-group-thumb"><IconGroups size={20} /></span>
          <span><b>{g.name}</b><small>Group</small></span>
        </Link>
      ))}
      {foundCitizens.length === 0 && foundGroups.length === 0 && (
        <div className="search-empty">No results for &ldquo;{query.trim()}&rdquo; in Jolchhaya.</div>
      )}
      <Link href={`/search?q=${encodeURIComponent(query.trim())}`} className="search-row search-see-all" onClick={closeSearch}>
        <span><b>See all results</b><small>Posts, pages, places and more</small></span>
      </Link>
    </>
  );

  const toggle = (p: "menu" | "bell" | "account") => {
    setPanel((cur) => (cur === p ? null : p));
    if (p === "bell") setUnread(0);
  };

  return (
    <header className="fb-header" ref={rootRef as never}>
      <div className="fb-header-left">
        <Link href="/" className="fb-logo" aria-label="Deep Dark Social home">d</Link>
        <div
          className="fb-search-wrap"
          onClick={() => { if (window.matchMedia("(max-width: 1099px)").matches) setMobileSearch(true); }}
        >
          <div className="fb-search">
            <IconSearch size={16} className="fb-search-icon" />
            <input
              className="fb-search-input"
              type="search"
              placeholder="Search Deep Dark Social"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSearchFocus(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && query.trim()) { router.push(`/search?q=${encodeURIComponent(query.trim())}`); setSearchFocus(false); }
                if (e.key === "Escape") setSearchFocus(false);
              }}
              aria-label="Search Deep Dark Social"
            />
          </div>
          {showResults && !mobileSearch && (
            <div className="search-results" role="listbox">
              {resultsList}
            </div>
          )}
        </div>
      </div>

      <nav className="fb-header-center" aria-label="Main navigation">
        <Link href="/" className={isHome ? "fb-nav-item active" : "fb-nav-item"} aria-label="Home" title="Home" aria-current={isHome ? "page" : undefined}>
          <IconHome size={28} />
        </Link>
        <Link href="/#town" className="fb-nav-item" aria-label="Projects" title="Projects">
          <IconStore size={28} />
        </Link>
        <Link href="/groups" className={isGroups ? "fb-nav-item active" : "fb-nav-item"} aria-label="Groups" title="Groups" aria-current={isGroups ? "page" : undefined}>
          <IconGroups size={28} />
        </Link>
        <Link href="/#citizens" className={isProfile ? "fb-nav-item active" : "fb-nav-item"} aria-label="Citizens" title="Citizens" aria-current={isProfile ? "page" : undefined}>
          <IconPerson size={28} />
        </Link>
      </nav>

      <div className="fb-header-right" data-testid="header-right">
        <button type="button" className="fb-round-button" aria-label="Menu" onClick={() => toggle("menu")}>
          <IconMenuGrid size={20} />
        </button>
        <button type="button" className="fb-round-button" aria-label="Notifications" onClick={() => toggle("bell")}>
          <IconBell size={20} />
          {unread > 0 && <span className="fb-badge">{unread}</span>}
        </button>
        <button type="button" className="fb-account-button" aria-label="Account menu" onClick={() => toggle("account")}>
          <Avatar id="watcher-riyad" name="Riyad" size={40} />
          <span className="account-chevron"><IconChevronDown size={12} /></span>
        </button>

        {panel === "menu" && (
          <div className="header-panel" data-panel="menu" role="dialog" aria-label="Menu">
            <div className="panel-title">Menu</div>
            <Link href="/" className="panel-row" onClick={() => setPanel(null)}><IconHome size={22} /> Home</Link>
            <Link href="/#citizens" className="panel-row" onClick={() => setPanel(null)}><IconPerson size={22} /> Citizens</Link>
            <Link href="/groups" className="panel-row" onClick={() => setPanel(null)}><IconGroups size={22} /> Groups</Link>
            <Link href="/#town" className="panel-row" onClick={() => setPanel(null)}><IconStore size={22} /> Jolchhaya town</Link>
            <Link href="/#episodes" className="panel-row" onClick={() => setPanel(null)}><IconPlayRect size={22} /> Daily Episode</Link>
          </div>
        )}
        {panel === "bell" && (
          <div className="header-panel" data-panel="notifications" role="dialog" aria-label="Notifications">
            <div className="panel-title">Notifications</div>
            {notifications.map((n) => (
              <Link key={n.id} href={n.href} className="panel-row panel-note" onClick={() => setPanel(null)}>
                <span className="note-dot" /> {n.text}
              </Link>
            ))}
          </div>
        )}
        {panel === "account" && (
          <div className="header-panel" data-panel="account" role="dialog" aria-label="Account">
            <div className="panel-account">
              <Avatar id="watcher-riyad" name="Riyad" size={40} />
              <span><b>Riyad</b><small>Watcher · town owner</small></span>
            </div>
            <Link href="/welcome" className="panel-row" onClick={() => setPanel(null)}>Log out</Link>
          </div>
        )}
      </div>

      {mobileSearch && (
        <div className="mobile-search-bar">
          <div className="fb-search mobile">
            <IconSearch size={16} className="fb-search-icon" />
            <input
              className="fb-search-input mobile-input"
              type="search"
              placeholder="Search Deep Dark Social"
              value={query}
              autoFocus
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSearchFocus(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && query.trim()) { router.push(`/search?q=${encodeURIComponent(query.trim())}`); closeSearch(); }
                if (e.key === "Escape") closeSearch();
              }}
              aria-label="Search Deep Dark Social"
            />
          </div>
          <button type="button" className="icon-circle-button grey" aria-label="Close search" onClick={closeSearch}>
            <IconClose size={20} />
          </button>
          {showResults && (
            <div className="search-results mobile-results" role="listbox">
              {resultsList}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
