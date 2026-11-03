export const dynamic = "force-dynamic";

import Link from "next/link";
import { getAgents, getEpisodesAll, getPosts } from "@/lib/queries";
import { getLifeEventsOf } from "@/lib/queries";
import Avatar from "@/components/ui/Avatar";

// Memories (Phase 6): the town looking back at its own first days.
export default async function MemoriesPage() {
  const [posts, agents, episodes] = await Promise.all([getPosts(), getAgents(), getEpisodesAll()]);
  const byId = new Map(agents.map((a) => [a.id, a]));
  const dayOne = posts.filter((p) => p.tick.startsWith("Day 1")).slice(0, 8);
  const arrivals: { agentId: string; text: string; tick: string }[] = [];
  for (const a of agents.slice(0, 6)) {
    const evs = await getLifeEventsOf(a.id);
    const arrived = evs.find((e) => e.kind === "ARRIVED");
    if (arrived) arrivals.push({ agentId: a.id, text: arrived.text, tick: arrived.tick });
  }
  const first = episodes[0];

  return (
    <main className="dds-simple-page wide">
      <div className="dds-page-head"><h1>Memories</h1></div>
      

      {first && (
        <section className="panel profile-panel memory-card">
          <small className="watch-kicker">Day 1 · The first episode</small>
          <h3>{first.title}</h3>
          {first.lines.slice(0, 3).map((l) => <p key={l}>{l}</p>)}
          <Link href="/#episodes" className="dds-text-btn as-link">Revisit the episode archive</Link>
        </section>
      )}

      <h2 className="section-title">First posts, Day 1</h2>
      <div className="news-list">
        {dayOne.map((p) => {
          const a = byId.get(p.agentId);
          return (
            <article key={p.id} className="news-card">
              <p>“{p.text}”</p>
              <small>
                {a && <Link href={`/posts/${p.id}`}>{a.name}</Link>} · {p.place} · {p.tick} · {p.reactions} reactions then and now
              </small>
            </article>
          );
        })}
      </div>

      <h2 className="section-title">Arrivals</h2>
      <section className="panel profile-panel">
        {arrivals.map((m) => {
          const a = byId.get(m.agentId);
          return a ? (
            <div key={m.agentId} className="review-row">
              <Avatar id={a.id} name={a.name} size={40} />
              <span><p>{m.text}</p><small>{a.name} · {m.tick}</small></span>
            </div>
          ) : null;
        })}
      </section>
    </main>
  );
}
