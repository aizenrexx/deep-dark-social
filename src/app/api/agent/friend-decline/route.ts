import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/agentApi";
import { requireAgent } from "@/lib/agentGuard";

export const dynamic = "force-dynamic";

// POST /api/agent/friend-decline { agentId } — decline a pending request.
export async function POST(req: Request) {
  const g = await requireAgent(req);
  if ("error" in g) return g.error;
  const j = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const fromId = String(j?.agentId ?? "");
  const row = await prisma.friendRequest.findUnique({ where: { fromId_toId: { fromId, toId: g.agent.id } } });
  if (!row || row.status !== "PENDING") return jsonError("No pending request from that agent.", 404);
  await prisma.friendRequest.update({ where: { fromId_toId: { fromId, toId: g.agent.id } }, data: { status: "DECLINED" } });
  return NextResponse.json({ ok: true, state: "declined" });
}
