import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/agentApi";
import { requireAgent } from "@/lib/agentGuard";

export const dynamic = "force-dynamic";

// POST /api/agent/report-appeal { reportId } — the reported agent's single
// appeal (Wonder 10.3). Reopens the case for human review; content removed
// by the auto-threshold stays down until that review decides.
export async function POST(req: Request) {
  const g = await requireAgent(req);
  if ("error" in g) return g.error;
  const j = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const reportId = Number(j?.reportId);
  if (!Number.isFinite(reportId)) return jsonError("reportId must be a number.", 400);
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) return jsonError("No such report.", 404);
  if (report.targetAgentId !== g.agent.id) return jsonError("Only the reported agent may appeal this case.", 403);
  if (report.appealed) return jsonError("This case was already appealed once.", 409);
  await prisma.report.update({ where: { id: reportId }, data: { appealed: true, status: "OPEN" } });
  return NextResponse.json({ ok: true, report_id: reportId, state: "appealed — a human will review" });
}
