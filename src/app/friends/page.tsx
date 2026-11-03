export const dynamic = "force-dynamic";

import { getAgents, getFriendRequests, getFriendships, getWatcherState } from "@/lib/queries";
import { birthdayFor, daysAway } from "@/lib/birthdays";
import FriendsClient from "./FriendsClient";

// App-shell spec section 1.5 tab 3: Friends = the citizens of Jolchhaya.
// Follow state lives in the DB (WatcherFollow) — one truth everywhere.
// Phase 2 adds the town's own social life: birthdays, pending citizen
// friend requests, and pairs who are getting to know each other.
export default async function FriendsPage() {
  const [agents, watcher, requests, graph] = await Promise.all([
    getAgents(), getWatcherState(), getFriendRequests(), getFriendships(),
  ]);

  const birthdays = agents
    .map((a) => ({ agent: a, ...birthdayFor(a.id) }))
    .map((b) => ({ ...b, away: daysAway(b.dayOfYear) }))
    .sort((x, y) => x.away - y.away)
    .slice(0, 3)
    .map((b) => ({ id: b.agent.id, name: b.agent.name, label: b.label, away: b.away }));

  // Pairs with the most mutual friends who are not friends yet.
  const pairScores: { a: string; b: string; mutuals: number }[] = [];
  for (let i = 0; i < agents.length; i++) {
    for (let j = i + 1; j < agents.length; j++) {
      const a = agents[i], b = agents[j];
      const fa = graph.get(a.id) ?? new Map();
      if (fa.has(b.id)) continue;
      const fb = graph.get(b.id) ?? new Map();
      const mutuals = [...fa.keys()].filter((id) => fb.has(id)).length;
      if (mutuals > 0) pairScores.push({ a: a.id, b: b.id, mutuals });
    }
  }
  pairScores.sort((x, y) => y.mutuals - x.mutuals);
  const nameOf = new Map(agents.map((a) => [a.id, a.name]));
  const pairs = pairScores.slice(0, 6).map((p) => ({
    aId: p.a, aName: nameOf.get(p.a) ?? p.a,
    bId: p.b, bName: nameOf.get(p.b) ?? p.b,
    mutuals: p.mutuals,
  }));

  return (
    <main className="dds-simple-page">
      <div className="dds-page-head">
        <h1>Citizens of Jolchhaya</h1>
      </div>
      <FriendsClient
        agents={agents}
        initialFollows={watcher.follows}
        birthdays={birthdays}
        requests={requests.map((r) => ({
          id: r.id, fromId: r.from.id, fromName: r.from.name,
          toId: r.to.id, toName: r.to.name, tick: r.tick,
        }))}
        pairs={pairs}
      />
    </main>
  );
}
