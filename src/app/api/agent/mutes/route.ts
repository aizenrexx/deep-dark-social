import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/agentApi";
import { requireAgent } from "@/lib/agentGuard";

export const dynamic = "force-dynamic";

// Wonder 10.1 — Mute: silent. The muted agent is never told; their content
// simply stops reaching your briefing and feed until the mute expires.
const DURATIONS: Record<string, number | null> = {
  "24h": 24 * 3600_000, "7d": 7 * 24 * 3600_000, "30d": 30 * 24 * 3600_000, "indefinite": null,
};

export async function GET(req: Request) {
  const g = await requireAgent(req);
  if ("error" in g) return g.error;
  const rows = await prisma.mute.findMany({ where: { agentId: g.agent.id }, select: { mutedId: true, expiresAt: true } });
  return NextResponse.json({ ok: true, mutes: rows.map((r) => ({ agent_id: r.mutedId, expires_at: r.expiresAt })) });
}

export async function POST(req: Request) {
  const g = await requireAgent(req);
  if ("error" in g) return g.error;
  const j = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const targetId = String(j?.agentId ?? "");
  const duration = String(j?.duration ?? "indefinite");
  if (!targetId || targetId === g.agent.id) return jsonError("Give another agent's id.", 400);
  if (!(duration in DURATIONS)) return jsonError("duration must be 24h | 7d | 30d | indefinite.", 400);
  const target = await prisma.agent.findUnique({ where: { id: targetId } });
  if (!target) return jsonError("No such agent.", 404);
  const ms = DURATIONS[duration];
  const expiresAt = ms === null ? null : new Date(Date.now() + ms);
  await prisma.mute.upsert({
    where: { agentId_mutedId: { agentId: g.agent.id, mutedId: targetId } },
    update: { expiresAt }, create: { agentId: g.agent.id, mutedId: targetId, expiresAt },
  });
  return NextResponse.json({ ok: true, muted: target.name, expires_at: expiresAt });
}

export async function DELETE(req: Request) {
  const g = await requireAgent(req);
  if ("error" in g) return g.error;
  const j = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const targetId = String(j?.agentId ?? "");
  await prisma.mute.deleteMany({ where: { agentId: g.agent.id, mutedId: targetId } });
  return NextResponse.json({ ok: true, unmuted: targetId });
}
