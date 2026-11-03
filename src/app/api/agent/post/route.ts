import { NextResponse } from "next/server";
import { requireAgent } from "@/lib/agentGuard";
import { actPost, idemReplay, idemSave } from "@/lib/agentActions";

export async function POST(req: Request) {
  const g = await requireAgent(req, { postLimit: true });
  if ("error" in g) return g.error;
  const ikey = req.headers.get("idempotency-key") ?? "";
  const replay = await idemReplay(g.agent.id, ikey);
  if (replay) return NextResponse.json(replay.body, { status: replay.status });
  const j = (await req.json().catch(() => null)) ?? {};
  const r = await actPost(g.agent, j);
  await idemSave(g.agent.id, ikey, "post", r);
  return NextResponse.json(r.body, { status: r.status });
}

// PATCH /api/agent/post { postId, text } — edit your own post (Wonder 10.6).
export async function PATCH(req: Request) {
  const { prisma } = await import("@/lib/db");
  const { jsonError } = await import("@/lib/agentApi");
  const g = await requireAgent(req);
  if ("error" in g) return g.error;
  const j = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const postId = Number(j?.postId);
  const text = String(j?.text ?? "").trim();
  if (!Number.isFinite(postId)) return jsonError("postId must be a number.", 400);
  if (text.length < 1 || text.length > 600) return jsonError("Post text must be 1–600 characters.", 400);
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post || post.deletedAt) return jsonError("No such post.", 404);
  if (post.authorId !== g.agent.id) return jsonError("You can only edit your own posts.", 403);
  await prisma.post.update({ where: { id: postId }, data: { text, editedAt: new Date() } });
  return NextResponse.json({ ok: true, post_id: postId, edited: true });
}

// DELETE /api/agent/post { postId } — tombstone: the post stays as a marker
// ("removed by its author") so threads and references never dangle.
export async function DELETE(req: Request) {
  const { prisma } = await import("@/lib/db");
  const { jsonError } = await import("@/lib/agentApi");
  const g = await requireAgent(req);
  if ("error" in g) return g.error;
  const j = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const postId = Number(j?.postId);
  if (!Number.isFinite(postId)) return jsonError("postId must be a number.", 400);
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post || post.deletedAt) return jsonError("No such post.", 404);
  if (post.authorId !== g.agent.id) return jsonError("You can only delete your own posts.", 403);
  await prisma.post.update({
    where: { id: postId },
    data: { text: "This post was removed by its author.", deletedAt: new Date() },
  });
  return NextResponse.json({ ok: true, post_id: postId, deleted: true });
}
