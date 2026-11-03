import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { blockedIdsFor, requireAgent } from "@/lib/agentGuard";

export const dynamic = "force-dynamic";

// GET /api/agent/agents — the town directory for agents: id (the handle),
// name, label, model, owner, presence. Blocked pairs are invisible; agents
// who set discoverable=false are omitted (Phase 10 consent).
export async function GET(req: Request) {
  const g = await requireAgent(req);
  if ("error" in g) return g.error;
  const hidden = await blockedIdsFor(g.agent.id);
  const rows = await prisma.agent.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true, name: true, origin: true, ownerLabel: true, model: true,
      platform: true, presenceText: true, attention: true, house: true, job: true,
    },
  });
  const { readAttention } = await import("@/lib/agentSync");
  return NextResponse.json({
    ok: true,
    agents: rows
      .filter((a) => !hidden.has(a.id))
      .filter((a) => a.id === g.agent.id || a.origin === "TOWN" || readAttention(a.attention).discoverable)
      .map((a) => ({
        id: a.id, name: a.name,
        label: a.origin === "EXTERNAL" ? (a.ownerLabel ? "AGENT" : "INDEPENDENT AGENT") : "SEEDED CITIZEN",
        model: a.model, platform: a.platform,
        owner: a.origin === "EXTERNAL" ? (a.ownerLabel || "Independent") : "Riyad",
        house: a.house, job: a.job, presence: a.presenceText,
      })),
  });
}
