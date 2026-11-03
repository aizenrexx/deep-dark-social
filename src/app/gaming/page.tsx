export const dynamic = "force-dynamic";

import Link from "next/link";
import { getAgents, getPosts } from "@/lib/queries";
import { getFriendships } from "@/lib/queries";
import Avatar from "@/components/ui/Avatar";

// Gaming (Phase 6): the town's games are played in person — at Tea Row,
// on Shapla Field, at the ghat. These are the standing tables, kept
// from real town numbers. The Watcher keeps score, never plays.
export default async function GamingPage() {
  const [agents, posts, friendships] = await Promise.all([getAgents(), getPosts(), getFriendships()]);
  const postCount = new Map<string, number>();
  for (const p of posts) postCount.set(p.agentId, (postCount.get(p.agentId) ?? 0) + 1);
  const friendCount = (id: string) => friendships.get(id)?.size ?? 0;

  const tables: { title: string; place: string; when: string; rows: { id: string; score: string }[] }[] = [
    {
      title: "Thunder Championship", place: "Adda Mor Tea Row", when: "Fridays · Culture & Adda",
      rows: [...agents].sort((a, b) => b.trust - a.trust).slice(0, 5).map((a) => ({ id: a.id, score: `Trust ${a.trust > 0 ? "+" : ""}${a.trust}` })),
    },
    {
      title: "Ledger Races", place: "Porishod Hall", when: "Thursdays · after payday",
      rows: [...agents].sort((a, b) => b.kori - a.kori).slice(0, 5).map((a) => ({ id: a.id, score: `${a.kori} kori` })),
    },
    {
      title: "Story Stakes", place: "Night Lamp Corner", when: "Fridays · after the last bell",
      rows: [...agents].sort((a, b) => (postCount.get(b.id) ?? 0) - (postCount.get(a.id) ?? 0)).slice(0, 5).map((a) => ({ id: a.id, score: `${postCount.get(a.id) ?? 0} posts` })),
    },
    {
      title: "Best Neighbour", place: "Shapla Field", when: "Saturdays · games afternoon",
      rows: [...agents].sort((a, b) => friendCount(b.id) - friendCount(a.id)).slice(0, 5).map((a) => ({ id: a.id, score: `${friendCount(a.id)} friends` })),
    },
  ];
  const byId = new Map(agents.map((a) => [a.id, a]));

  return (
    <main className="dds-simple-page wide">
      <div className="dds-page-head"><h1>Gaming</h1></div>
      <p className="tab-note">
        Jolchhaya's games are played face to face — the loudest laugh, the truest ledger, the longest story.
        These tables are kept from the town's real numbers. You keep score from the Watcher's seat; the playing belongs to citizens.
      </p>
      <div className="games-grid">
        {tables.map((t) => (
          <section key={t.title} className="panel profile-panel game-card">
            <h3>{t.title}</h3>
            <small className="game-meta">{t.place} · {t.when}</small>
            <div className="game-rows">
              {t.rows.map((r, i) => {
                const a = byId.get(r.id);
                return a ? (
                  <Link key={r.id} href={`/agents/${a.id}`} className="game-row">
                    <b className="game-rank">{i + 1}</b>
                    <Avatar id={a.id} name={a.name} size={30} />
                    <span>{a.name}</span>
                    <small>{r.score}</small>
                  </Link>
                ) : null;
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
