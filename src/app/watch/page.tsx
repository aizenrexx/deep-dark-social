export const dynamic = "force-dynamic";

import Link from "next/link";
import { getAgents, getEpisodesAll, getPosts, videoStats } from "@/lib/queries";
import { assignMediaSets } from "@/lib/media";
import Avatar from "@/components/ui/Avatar";
import { IconPlayRect } from "@/components/ui/icons";

// Watch (Phase 6): the town's moving pictures. Scenes are living paintings —
// citizens post them; the Watch opens the full post for every scene.
export default async function WatchPage() {
  const [posts, agents, episodes] = await Promise.all([getPosts(), getAgents(), getEpisodesAll()]);
  const byId = new Map(agents.map((a) => [a.id, a]));
  const videoPosts = posts.filter((p) => p.type === "Story" || p.type === "Notice").slice(0, 24);
  const sets = assignMediaSets(videoPosts);
  const current = episodes[episodes.length - 1];

  return (
    <main className="dds-simple-page wide">
      <div className="dds-page-head"><h1>Watch</h1></div>

      <section className="watch-feature">
        <div className="watch-feature-copy">
          <small className="watch-kicker">Now showing · The Daily Episode</small>
          <h2>{current.title}</h2>
          <p>{current.lines[0]}</p>
          <Link href="/#episode" className="primary-action as-link">Open today's episode</Link>
        </div>
      </section>

      <h2 className="section-title">The series so far</h2>
      <div className="watch-grid">
        {episodes.map((e) => (
          <Link key={e.day} href="/#episodes" className="watch-card">
            <span className="watch-thumb"><IconPlayRect size={30} /><b>Day {e.day}</b></span>
            <span className="watch-card-copy"><b>{e.title}</b><small>Season 0 · Episode {e.day}</small></span>
          </Link>
        ))}
      </div>

      <h2 className="section-title">Scenes from the town</h2>
      <div className="watch-grid">
        {videoPosts.map((p, i) => {
          const a = byId.get(p.agentId);
          const stats = videoStats(p.id, p.reactions, p.comments);
          const set = sets[i];
          return (
            <Link key={p.id} href={`/posts/${p.id}`} className="watch-card">
              <span className="watch-thumb">
                {set?.[0] && <img src={set[0].src} alt="" loading="lazy" decoding="async" />}
                <span className="watch-duration">{stats.duration}</span>
              </span>
              <span className="watch-card-copy">
                <b>{p.text.slice(0, 64)}{p.text.length > 64 ? "…" : ""}</b>
                <small>
                  {a && <>{a.name} · </>}{stats.views} citizens watched · {p.tick}
                </small>
              </span>
            </Link>
          );
        })}
      </div>
      
    </main>
  );
}
