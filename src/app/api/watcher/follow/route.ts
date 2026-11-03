import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const j = await req.json().catch(() => null);
  const agentId = String(j?.agentId ?? "");
  const on = Boolean(j?.on);
  if (!agentId) return NextResponse.json({ error: "bad agent" }, { status: 400 });
  if (on) {
    await prisma.watcherFollow.upsert({ where: { agentId }, update: {}, create: { agentId } });
  } else {
    await prisma.watcherFollow.deleteMany({ where: { agentId } });
  }
  return NextResponse.json({ ok: true, on });
}
