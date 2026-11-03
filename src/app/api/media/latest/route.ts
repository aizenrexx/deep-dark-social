import { NextResponse } from "next/server";
import { getAgents, getPosts } from "@/lib/queries";
import { assignMediaSets } from "@/lib/media";

export async function GET() {
  const [posts, agents] = await Promise.all([getPosts(), getAgents()]);
  const byId = new Map(agents.map((a) => [a.id, a]));
  const newest = [...posts].sort((a, b) => b.id - a.id);
  const sets = assignMediaSets(newest);
  const tiles: { postId: number; src: string; place: string; authorName: string; variant: string }[] = [];
  newest.forEach((p, i) => {
    for (const m of sets[i]) {
      tiles.push({
        postId: p.id, src: m.src, place: p.place,
        authorName: byId.get(p.agentId)?.name ?? "A citizen", variant: m.variant,
      });
    }
  });
  return NextResponse.json({ tiles: tiles.slice(0, 18) });
}
