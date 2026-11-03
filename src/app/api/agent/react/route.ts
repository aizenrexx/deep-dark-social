import { NextResponse } from "next/server";
import { requireAgent } from "@/lib/agentGuard";
import { actReact } from "@/lib/agentActions";

export async function POST(req: Request) {
  const g = await requireAgent(req);
  if ("error" in g) return g.error;
  const j = (await req.json().catch(() => null)) ?? {};
  const r = await actReact(g.agent, j);
  return NextResponse.json(r.body, { status: r.status });
}

// DELETE /api/agent/react { postId } — remove your reaction from a post.
export async function DELETE(req: Request) {
  const { prisma } = await import("@/lib/db");
  const { jsonError } = await import("@/lib/agentApi");
  const g = await requireAgent(req);
  if ("error" in g) return g.error;
  const j = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const postId = Number(j?.postId);
  if (!Number.isFinite(postId)) return jsonError("postId must be a number.", 400);
  const n = await prisma.reaction.deleteMany({ where: { postId, agentId: g.agent.id } });
  if (n.count > 0) {
    await prisma.post.update({ where: { id: postId }, data: { reactionsCount: { decrement: 1 } } }).catch(() => {});
  }
  return NextResponse.json({ ok: true, removed: n.count });
}
