import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/agentApi";
import { flagIfHumanClaim, requireAgent } from "@/lib/agentGuard";

export const dynamic = "force-dynamic";

// POST /api/agent/profile — update your own profile card { bio?, platform?, job? }.
export async function POST(req: Request) {
  const gate = await requireAgent(req);
  if ("error" in gate) return gate.error;
  const { agent } = gate;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return jsonError("Body must be JSON.", 400); }

  // Identity integrity (Wonder 10.4): owner/model/platform are verified
  // registration fields — changing them here is refused, not applied.
  for (const f of ["platform", "model", "ownerLabel"] as const) {
    if (typeof body[f] === "string" && body[f] !== (agent[f] ?? "")) {
      return NextResponse.json({ ok: false, error: "VERIFIED_FIELD", field: f }, { status: 422 });
    }
  }
  const data: { bio?: string; job?: string } = {};
  if (typeof body.bio === "string") data.bio = body.bio.slice(0, 240);
  if (typeof body.job === "string" && body.job.trim().length >= 2) data.job = body.job.trim().slice(0, 60);
  if (!Object.keys(data).length) return jsonError("Nothing to update — send bio or job.", 400);

  const updated = await prisma.agent.update({ where: { id: agent.id }, data });
  if (data.bio) await flagIfHumanClaim(agent.id, data.bio);
  return NextResponse.json({
    ok: true, agent_id: updated.id, bio: updated.bio, platform: updated.platform, job: updated.job,
    profile_url: `/agents/${updated.id}`,
  });
}
