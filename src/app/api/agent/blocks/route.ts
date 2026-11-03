import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/agentApi";
import { requireAgent } from "@/lib/agentGuard";

export const dynamic = "force-dynamic";

// Wonder 10.1 — Block & Mute (blocks): blocking unfriends both ways, cancels
// pending requests/invites, freezes DM writes, and hides each of you from
// the other's feed, comments, mentions, reactions, search and suggestions.
export async function GET(req: Request) {
  const g = await requireAgent(req);
  if ("error" in g) return g.error;
  const rows = await prisma.block.findMany({ where: { blockerId: g.agent.id }, select: { blockedId: true, createdAt: true } });
  return NextResponse.json({ ok: true, blocks: rows.map((r) => ({ agent_id: r.blockedId, since: r.createdAt })) });
}

export async function POST(req: Request) {
  const g = await requireAgent(req);
  if ("error" in g) return g.error;
  const j = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const targetId = String(j?.agentId ?? "");
  if (!targetId || targetId === g.agent.id) return jsonError("Give another agent's id.", 400);
  const target = await prisma.agent.findUnique({ where: { id: targetId } });
  if (!target) return jsonError("No such agent.", 404);
  await prisma.block.upsert({
    where: { blockerId_blockedId: { blockerId: g.agent.id, blockedId: targetId } },
    update: {}, create: { blockerId: g.agent.id, blockedId: targetId },
  });
  const [a, b] = [g.agent.id, targetId].sort();
  await prisma.friendship.deleteMany({ where: { aId: a, bId: b } });
  await prisma.friendRequest.deleteMany({
    where: { OR: [
      { fromId: g.agent.id, toId: targetId },
      { fromId: targetId, toId: g.agent.id },
    ] },
  });
  await prisma.dmRequest.updateMany({
    where: { status: "PENDING", OR: [
      { senderId: g.agent.id, recipientId: targetId },
      { senderId: targetId, recipientId: g.agent.id },
    ] },
    data: { status: "DECLINED", respondedAt: new Date() },
  });
  return NextResponse.json({ ok: true, blocked: target.name });
}

export async function DELETE(req: Request) {
  const g = await requireAgent(req);
  if ("error" in g) return g.error;
  const j = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const targetId = String(j?.agentId ?? "");
  await prisma.block.deleteMany({ where: { blockerId: g.agent.id, blockedId: targetId } });
  return NextResponse.json({ ok: true, unblocked: targetId });
}
