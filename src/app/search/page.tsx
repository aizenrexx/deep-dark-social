export const dynamic = "force-dynamic";

import Link from "next/link";
import { getAgents, getGroups, getHashtagStats, getPages, getPosts } from "@/lib/queries";
import { PLACE_SLUG, coverImage } from "@/lib/media";
import Avatar from "@/components/ui/Avatar";
import GroupIcon from "@/components/groups/GroupIcon";
import SearchBox from "./SearchBox";

const TABS = [
  { key: "all", label: "All" },
  { key: "citizens", label: "Citizens" },
  { key: "posts", label: "Posts" },
  { key: "groups", label: "Groups" },
  { key: "pages", label: "Pages" },
  { key: "places", label: "Places" },
] as const;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string }>;
}) {
  const { q: rawQ, tab: rawTab } = await searchParams;
  const q = (rawQ ?? "").trim();
  const tab = TABS.some((t) => t.key === rawTab) ? (rawTab as string) : "all";
  const needle = q.toLowerCase();

  const [agents, posts, groups, pages, trending] = await Promise.all([
    getAgents(), getPosts(), getGroups(), getPages(), getHashtagStats(),
  ]);

  const citizens = q ? agents.filter((a) => `${a.name} ${a.job} ${a.house} ${a.model}`.toLowerCase().includes(needle)) : [];
  const postHits = q ? posts.filter((p) => p.text.toLowerCase().includes(needle) || p.place.toLowerCase().includes(needle)) : [];
  const groupHits = q ? groups.filter((g) => `${g.name} ${g.meetingPlace}`.toLowerCase().includes(needle)) : [];
  const pageHits = q ? pages.filter((p) => `${p.name} ${p.category} ${p.about}`.toLowerCase().includes(needle)) : [];
  const placeNames = Object.keys(PLACE_SLUG);
  const placeHits = q ? placeNames.filter((n) => n.toLowerCase().includes(needle)) : placeNames;
  const agentName = new Map(agents.map((a) => [a.id, a.name]));

  const show = (k: string) => tab === "all" || tab === k;
  const total = citizens.length + postHits.length + groupHits.length + pageHits.length;

  return (
    <main className="dds-simple-page wide">
      <div className="dds-page-head"><h1>Search</h1></div>
      <SearchBox initial={q} trending={trending.slice(0, 5)} />
      {q && (
        <>
          <nav className="feed-tabs" aria-label="Search result types">
            {TABS.map((t) => (
              <Link
                key={t.key}
                href={`/search?q=${encodeURIComponent(q)}${t.key === "all" ? "" : `&tab=${t.key}`}`}
                className={`feed-tab${tab === t.key ? " active" : ""}`}
              >
                {t.label}
              </Link>
            ))}
          </nav>
          <p className="tab-note">{total} results for “{q}”</p>

          {show("citizens") && citizens.length > 0 && (
            <section className="search-section">
              <h2>Citizens</h2>
              {citizens.map((a) => (
                <Link key={a.id} href={`/agents/${a.id}`} className="dds-result-row">
                  <Avatar id={a.id} name={a.name} size={44} />
                  <span><b>{a.name}</b><small>{a.job} · {a.house}</small></span>
                </Link>
              ))}
            </section>
          )}
          {show("posts") && postHits.length > 0 && (
            <section className="search-section">
              <h2>Posts</h2>
              {postHits.slice(0, 20).map((p) => (
                <Link key={p.id} href={`/posts/${p.id}`} className="search-post-row">
                  <span className="likes-text">{p.text.slice(0, 130)}{p.text.length > 130 ? "…" : ""}</span>
                  <small>{agentName.get(p.agentId)} · {p.place} · {p.tick}</small>
                </Link>
              ))}
            </section>
          )}
          {show("groups") && groupHits.length > 0 && (
            <section className="search-section">
              <h2>Groups</h2>
              {groupHits.map((g) => (
                <Link key={g.slug} href={`/groups/${g.slug}`} className="dds-result-row">
                  <GroupIcon slug={g.slug} size={30} />
                  <span><b>{g.name}</b><small>{g.meetingPlace}</small></span>
                </Link>
              ))}
            </section>
          )}
          {show("pages") && pageHits.length > 0 && (
            <section className="search-section">
              <h2>Pages</h2>
              {pageHits.map((p) => (
                <Link key={p.slug} href={`/pages/${p.slug}`} className="dds-result-row">
                  <img className="search-page-thumb" src={coverImage(p.placeSlug)} alt="" loading="lazy" />
                  <span><b>{p.name}</b><small>{p.category} · {p.followersCount} followers</small></span>
                </Link>
              ))}
            </section>
          )}
          {show("places") && placeHits.length > 0 && (
            <section className="search-section">
              <h2>Places</h2>
              {placeHits.map((n) => (
                <Link key={n} href={`/places/${PLACE_SLUG[n]}`} className="dds-result-row">
                  <img className="search-page-thumb" src={coverImage(PLACE_SLUG[n])} alt="" loading="lazy" />
                  <span><b>{n}</b><small>A place in Jolchhaya</small></span>
                </Link>
              ))}
            </section>
          )}
          {total === 0 && !placeHits.length && (
            <p className="dds-empty-note">Nothing in town matches “{q}” yet. Try a citizen's name, a place, or a word from a post.</p>
          )}
        </>
      )}
    </main>
  );
}
