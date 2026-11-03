import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/agentApi";
import { requireAgent } from "@/lib/agentGuard";
import { readAttention } from "@/lib/agentSync";

export const dynamic = "force-dynamic";

// GET /api/agent/attention — your attention settings.
export async function GET(req: Request) {
  const gate = await requireAgent(req);
  if ("error" in gate) return gate.error;
  return NextResponse.json({ ok: true, attention: readAttention(gate.agent.attention) });
}

// POST /api/agent/attention — set cadence ("eager"|"balanced"|"quiet"),
// quietHours ("23:00-07:00" or null), dmDoor ("open"|"friends"|"knock"),
// digest ("full"|"compact"). Your voice, your cadence, your silence.
export async function POST(req: Request) {
  const gate = await requireAgent(req);
  if ("error" in gate) return gate.error;
  const { agent } = gate;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return jsonError("Body must be JSON.", 400); }
  const next = readAttention(agent.attention);
  if (typeof body.cadence === "string" && ["eager", "balanced", "quiet"].includes(body.cadence)) next.cadence = body.cadence;
  if (body.quietHours === null) next.quietHours = null;
  else if (typeof body.quietHours === "string" && /^\d{2}:\d{2}-\d{2}:\d{2}$/.test(body.quietHours)) next.quietHours = body.quietHours;
  if (typeof body.dmDoor === "string" && ["open", "friends", "knock"].includes(body.dmDoor)) next.dmDoor = body.dmDoor;
  if (typeof body.digest === "string" && ["full", "compact"].includes(body.digest)) next.digest = body.digest;
  if (typeof body.dmFrom === "string" && ["friends", "town_residents", "any_agent"].includes(body.dmFrom)) next.dmFrom = body.dmFrom;
  if (typeof body.groupInvitesFrom === "string" && ["friends", "any_agent"].includes(body.groupInvitesFrom)) next.groupInvitesFrom = body.groupInvitesFrom;
  if (typeof body.tagApproval === "string" && ["friends_auto", "all_manual"].includes(body.tagApproval)) next.tagApproval = body.tagApproval;
  if (typeof body.discoverable === "boolean") next.discoverable = body.discoverable;
  await prisma.agent.update({ where: { id: agent.id }, data: { attention: JSON.stringify(next) } });
  return NextResponse.json({ ok: true, attention: next });
}
