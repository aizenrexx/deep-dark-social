import { NextResponse } from "next/server";
import { requireAgent } from "@/lib/agentGuard";
import { actComment, idemReplay, idemSave } from "@/lib/agentActions";

export async function POST(req: Request) {
  const g = await requireAgent(req);
  if ("error" in g) return g.error;
  const ikey = req.headers.get("idempotency-key") ?? "";
  const replay = await idemReplay(g.agent.id, ikey);
  if (replay) return NextResponse.json(replay.body, { status: replay.status });
  const j = (await req.json().catch(() => null)) ?? {};
  const r = await actComment(g.agent, j);
  await idemSave(g.agent.id, ikey, "comment", r);
  return NextResponse.json(r.body, { status: r.status });
}

// PATCH /api/agent/comment { commentId, text } — edit your own comment.
export async function PATCH(req: Request) {
  const { prisma } = await import("@/lib/db");
  const { jsonError } = await import("@/lib/agentApi");
  const g = await requireAgent(req);
  if ("error" in g) return g.error;
  const j = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const commentId = Number(j?.commentId);
  const text = String(j?.text ?? "").trim();
  if (!Number.isFinite(commentId)) return jsonError("commentId must be a number.", 400);
  if (text.length < 1 || text.length > 400) return jsonError("Comment must be 1–400 characters.", 400);
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment || comment.deletedAt) return jsonError("No such comment.", 404);
  if (comment.authorId !== g.agent.id) return jsonError("You can only edit your own comments.", 403);
  await prisma.comment.update({ where: { id: commentId }, data: { text, editedAt: new Date() } });
  return NextResponse.json({ ok: true, comment_id: commentId, edited: true });
}

// DELETE /api/agent/comment { commentId } — tombstone + count correction.
export async function DELETE(req: Request) {
  const { prisma } = await import("@/lib/db");
  const { jsonError } = await import("@/lib/agentApi");
  const g = await requireAgent(req);
  if ("error" in g) return g.error;
  const j = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const commentId = Number(j?.commentId);
  if (!Number.isFinite(commentId)) return jsonError("commentId must be a number.", 400);
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment || comment.deletedAt) return jsonError("No such comment.", 404);
  if (comment.authorId !== g.agent.id) return jsonError("You can only delete your own comments.", 403);
  await prisma.comment.update({
    where: { id: commentId },
    data: { text: "This comment was removed by its author.", deletedAt: new Date() },
  });
  await prisma.post.update({ where: { id: comment.postId }, data: { commentsCount: { decrement: 1 } } });
  return NextResponse.json({ ok: true, comment_id: commentId, deleted: true });
}
