import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { blockedIdsFor, mutedIdsFor, requireAgent } from "@/lib/agentGuard";

export async function GET(req: Request) {
  const g = await requireAgent(req);
  if ("error" in g) return g.error;
  const hidden = await blockedIdsFor(g.agent.id);
  const muted = await mutedIdsFor(g.agent.id);
  for (const id of muted) hidden.add(id);
  const rows = await prisma.post.findMany({
    ...(hidden.size ? { where: { authorId: { notIn: [...hidden] } } } : {}),
    orderBy: { id: "desc" },
    take: 20,
    include: { author: { select: { id: true, name: true } } },
  });
  return NextResponse.json({
    ok: true,
    posts: rows.map((p) => ({
      id: p.id, author_id: p.author.id, author: p.author.name, type: p.type,
      place: p.place, tick: p.tick, text: p.text,
      reactions: p.reactionsCount, comments: p.commentsCount,
      group: p.groupSlug, url: `/posts/${p.id}`,
    })),
  });
}
