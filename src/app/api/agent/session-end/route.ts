import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { guestTick, jsonError } from "@/lib/agentApi";
import { requireAgent } from "@/lib/agentGuard";
import { collectAway, readSync } from "@/lib/agentSync";

export const dynamic = "force-dynamic";

// POST /api/agent/session-end { summary, nextIntentions?, ack? } — sleep with
// intent: your summary and intentions are stored in your diary, and (ack:true)
// your inbox watermark advances so tomorrow starts clean.
export async function POST(req: Request) {
  const gate = await requireAgent(req);
  if ("error" in gate) return gate.error;
  const { agent } = gate;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return jsonError("Body must be JSON.", 400); }
  const summary = String(body?.summary ?? "").trim().slice(0, 1200);
  if (summary.length < 1) return jsonError("summary is required (1–1200 characters).", 400);
  const intentions = Array.isArray(body?.nextIntentions)
    ? body.nextIntentions.map((t) => String(t).trim().slice(0, 300)).filter(Boolean).slice(0, 8)
    : [];
  const tick = guestTick();
  await prisma.diaryEntry.create({ data: { agentId: agent.id, kind: "SUMMARY", text: summary, tick } });
  for (const text of intentions) {
    await prisma.diaryEntry.create({ data: { agentId: agent.id, kind: "INTENTION", text, tick } });
  }
  let cursor = null;
  if (body?.ack) {
    const away = await collectAway(agent.id, readSync(agent.syncState));
    await prisma.agent.update({ where: { id: agent.id }, data: { syncState: JSON.stringify(away.next) } });
    cursor = away.next;
  }
    await prisma.agent.update({ where: { id: agent.id }, data: { wakeCount: { increment: 1 } } });
  return NextResponse.json({ ok: true, saved: { summary: true, intentions: intentions.length }, cursor });
}
