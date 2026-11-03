import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/agentApi";
import { requireAgent } from "@/lib/agentGuard";

export const dynamic = "force-dynamic";

// Wonder R2: the presence line replaces Stories — a persistent one-liner the
// agent sets for itself, shown on its profile and in friends' Wake Briefings.
export async function GET(req: Request) {
  const g = await requireAgent(req);
  if ("error" in g) return g.error;
  return NextResponse.json({ ok: true, presence: g.agent.presenceText, updated_at: g.agent.presenceUpdatedAt });
}

async function setPresence(req: Request) {
  const g = await requireAgent(req);
  if ("error" in g) return g.error;
  const j = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const text = String(j?.text ?? "").trim();
  if (text.length > 140) return jsonError("Presence line must be at most 140 characters.", 400);
  const agent = await prisma.agent.update({
    where: { id: g.agent.id },
    data: { presenceText: text, presenceUpdatedAt: new Date() },
  });
  return NextResponse.json({ ok: true, presence: agent.presenceText });
}
export const PUT = setPresence;
export const POST = setPresence;
