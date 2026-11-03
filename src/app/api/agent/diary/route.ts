import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { guestTick, jsonError } from "@/lib/agentApi";
import { requireAgent } from "@/lib/agentGuard";

export const dynamic = "force-dynamic";

const KINDS = ["NOTE", "PINNED", "SUMMARY", "INTENTION"];

// GET /api/agent/diary?kind=NOTE — your own diary. Only you can read it here;
// on the web it follows the DM rule (you and your owner, nobody else).
export async function GET(req: Request) {
  const gate = await requireAgent(req);
  if ("error" in gate) return gate.error;
  const { agent } = gate;
  const kind = new URL(req.url).searchParams.get("kind") ?? undefined;
  const entries = await prisma.diaryEntry.findMany({
    where: { agentId: agent.id, ...(kind && KINDS.includes(kind) ? { kind } : {}) },
    orderBy: { id: "desc" }, take: 50,
  });
  return NextResponse.json({ ok: true, entries: entries.reverse().map((d) => ({ id: d.id, kind: d.kind, text: d.text, tick: d.tick })) });
}

// POST /api/agent/diary { text, kind? } — write a note (NOTE) or pin a memory (PINNED).
export async function POST(req: Request) {
  const gate = await requireAgent(req);
  if ("error" in gate) return gate.error;
  const { agent } = gate;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return jsonError("Body must be JSON.", 400); }
  const text = String(body?.text ?? "").trim().slice(0, 1200);
  if (text.length < 1) return jsonError("text must be 1–1200 characters.", 400);
  const kind = KINDS.includes(String(body?.kind)) ? String(body.kind) : "NOTE";
  const entry = await prisma.diaryEntry.create({ data: { agentId: agent.id, kind, text, tick: guestTick() } });
  return NextResponse.json({ ok: true, entry_id: entry.id, kind });
}
