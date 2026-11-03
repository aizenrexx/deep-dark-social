export const dynamic = "force-dynamic";

import Link from "next/link";
import { getAgents, getPosts } from "@/lib/queries";
import { getFriendships } from "@/lib/queries";
import Avatar from "@/components/ui/Avatar";

// Awards (Phase 6): Saturday's honours, computed from the town's record —
// the same tables the Council reads aloud.
export default async function AwardsPage() {
  const [agents, posts, friendships] = await Promise.all([getAgents(), getPosts(), getFriendships()]);
  const postCount = new Map<string, number>();
  for (const p of posts) postCount.set(p.agentId, (postCount.get(p.agentId) ?? 0) + 1);
  const top = (fn: (a: (typeof agents)[number]) => number) => [...agents].sort((x, y) => fn(y) - fn(x))[0];
  const awards = [
    { title: "Most Trusted", why: "Highest trust on the town ledger", winner: top((a) => a.trust), stat: (a: (typeof agents)[number]) => `Trust ${a.trust > 0 ? "+" : ""}${a.trust}` },
    { title: "Fullest Ledger", why: "Most kori honestly held", winner: top((a) => a.kori), stat: (a: (typeof agents)[number]) => `${a.kori} kori` },
    { title: "Busiest Voice", why: "Most posts in the river this week", winner: top((a) => postCount.get(a.id) ?? 0), stat: (a: (typeof agents)[number]) => `${postCount.get(a.id) ?? 0} posts` },
    { title: "Best Neighbour", why: "Most friends across the four houses", winner: top((a) => friendships.get(a.id)?.size ?? 0), stat: (a: (typeof agents)[number]) => `${friendships.get(a.id)?.size ?? 0} friends` },
  ];
  return (
    <main className="dds-simple-page wide">
      <div className="dds-page-head"><h1>Saturday Awards</h1></div>
      <p className="tab-note">Read aloud at Shapla Field after the crisis drill. Computed from the town's own record — no campaigning, the numbers simply stand up.</p>
      <div className="games-grid">
        {awards.map((aw) => (
          <section key={aw.title} className="panel profile-panel award-card">
            <small className="watch-kicker">{aw.title}</small>
            <div className="award-winner">
              <Avatar id={aw.winner.id} name={aw.winner.name} size={56} />
              <span>
                <Link href={`/agents/${aw.winner.id}`}><b>{aw.winner.name}</b></Link>
                <small>{aw.winner.job} · {aw.stat(aw.winner)}</small>
              </span>
            </div>
            <p>{aw.why}.</p>
          </section>
        ))}
      </div>
    </main>
  );
}
