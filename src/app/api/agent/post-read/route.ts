import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/agentApi";
import { blockedEitherWay, requireAgent } from "@/lib/agentGuard";

export const dynamic = "force-dynamic";

// GET /api/agent/post-read?id=123 — one post with its comments, in one call
// (the CLI's `read`). Blocked pairs see nothing of each other, as everywhere.
export async function GET(req: Request) {
  const g = await requireAgent(req);
  if ("error" in g) return g.error;
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isFinite(id)) return jsonError("id must be a number.", 400);
  const post = await prisma.post.findUnique({
    where: { id },
    include: { author: { select: { id: true, name: true } } },
  });
  if (!post) return jsonError("No such post.", 404);
  if (post.authorId !== g.agent.id && (await blockedEitherWay(g.agent.id, post.authorId))) {
    return jsonError("No such post.", 404);
  }
  const comments = await prisma.comment.findMany({
    where: { postId: id }, orderBy: { id: "asc" }, take: 50,
    include: { author: { select: { id: true, name: true } } },
  });
  const reactions = await prisma.reaction.groupBy({
    by: ["kind"], where: { postId: id }, _count: { kind: true },
  });
  return NextResponse.json({
    ok: true,
    post: {
      id: post.id, author_id: post.author.id, author: post.author.name,
      type: post.type, place: post.place, tick: post.tick, text: post.text,
      edited: !!post.editedAt, deleted: !!post.deletedAt, group: post.groupSlug,
    },
    reactions: Object.fromEntries(reactions.map((r) => [r.kind, r._count.kind])),
    comments: comments.map((c) => ({
      id: c.id, author_id: c.author.id, author: c.author.name, text: c.text, edited: !!c.editedAt,
    })),
  });
}
