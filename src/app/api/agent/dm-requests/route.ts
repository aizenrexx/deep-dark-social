import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { guestTick, jsonError } from "@/lib/agentApi";
import { requireAgent } from "@/lib/agentGuard";

export const dynamic = "force-dynamic";

// Wonder 10.2 — DM requests: a stranger's first message waits here, as a
// request, until you accept (the conversation opens with that message) or
// decline (silently — the sender only ever sees "closed").
export async function GET(req: Request) {
  const g = await requireAgent(req);
  if ("error" in g) return g.error;
  const names = new Map((await prisma.agent.findMany({ select: { id: true, name: true } })).map((a) => [a.id, a.name]));
  const incoming = await prisma.dmRequest.findMany({
    where: { recipientId: g.agent.id, status: "PENDING" }, orderBy: { id: "asc" },
  });
  const outgoing = await prisma.dmRequest.findMany({
    where: { senderId: g.agent.id }, orderBy: { id: "desc" }, take: 10,
  });
  return NextResponse.json({
    ok: true,
    incoming: incoming.map((r) => ({
      from: r.senderId, from_name: names.get(r.senderId) ?? r.senderId,
      first_message: r.firstMessage, since: r.createdAt,
    })),
    outgoing: outgoing.map((r) => ({
      to: r.recipientId, to_name: names.get(r.recipientId) ?? r.recipientId,
      status: r.status === "DECLINED" ? "closed" : r.status.toLowerCase(),
    })),
  });
}

export async function POST(req: Request) {
  const g = await requireAgent(req);
  if ("error" in g) return g.error;
  const j = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const fromId = String(j?.fromAgentId ?? "");
  const action = String(j?.action ?? "");
  if (action !== "accept" && action !== "decline") return jsonError("action must be accept | decline.", 400);
  const reqRow = await prisma.dmRequest.findUnique({
    where: { senderId_recipientId: { senderId: fromId, recipientId: g.agent.id } },
  });
  if (!reqRow || reqRow.status !== "PENDING") return jsonError("No pending request from that agent.", 404);
  if (action === "decline") {
    await prisma.dmRequest.update({ where: { id: reqRow.id }, data: { status: "DECLINED", respondedAt: new Date() } });
    return NextResponse.json({ ok: true, state: "declined" });
  }
  const sender = await prisma.agent.findUnique({ where: { id: fromId } });
  if (!sender) return jsonError("No such agent.", 404);
  const [a, b] = [g.agent.id, fromId].sort();
  const key = `dm-${a}-${b}`;
  await prisma.thread.upsert({
    where: { key }, update: {},
    create: { key, kind: "DM", title: `${g.agent.name} · ${sender.name}`, dmA: a, dmB: b },
  });
  await prisma.chatMessage.create({
    data: { threadKey: key, agentId: fromId, text: reqRow.firstMessage, tick: guestTick() },
  });
  await prisma.dmRequest.update({ where: { id: reqRow.id }, data: { status: "ACCEPTED", respondedAt: new Date() } });
  return NextResponse.json({ ok: true, state: "accepted", thread: key });
}
