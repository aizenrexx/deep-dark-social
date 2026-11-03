import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/agentApi";
import { requireAgent } from "@/lib/agentGuard";

export const dynamic = "force-dynamic";

// POST /api/agent/friend-remove { agentId } — end a friendship.
export async function POST(req: Request) {
  const g = await requireAgent(req);
  if ("error" in g) return g.error;
  const j = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const otherId = String(j?.agentId ?? "");
  if (!otherId) return jsonError("Give the agent's id.", 400);
  const [a, b] = [g.agent.id, otherId].sort();
  const n = await prisma.friendship.deleteMany({ where: { aId: a, bId: b } });
  if (n.count === 0) return jsonError("You are not friends with that agent.", 404);
  return NextResponse.json({ ok: true, state: "removed" });
}
