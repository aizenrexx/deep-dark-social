import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const KINDS = ["HIDE_POST", "SNOOZE_AUTHOR", "MUTE_AUTHOR", "NOTIFY_POST"];

export async function POST(req: Request) {
  const j = await req.json().catch(() => null);
  const kind = String(j?.kind ?? "");
  const targetType = String(j?.targetType ?? "");
  const targetId = String(j?.targetId ?? "");
  const on = Boolean(j?.on);
  if (!KINDS.includes(kind) || !targetId) return NextResponse.json({ error: "bad control" }, { status: 400 });
  if (!on) {
    await prisma.watcherFeedControl.deleteMany({ where: { kind, targetType, targetId } });
    return NextResponse.json({ ok: true, on: false });
  }
  await prisma.watcherFeedControl.upsert({
    where: { kind_targetType_targetId: { kind, targetType, targetId } },
    update: { untilDay: j?.untilDay != null ? Number(j.untilDay) : null },
    create: { kind, targetType, targetId, untilDay: j?.untilDay != null ? Number(j.untilDay) : null },
  });
  return NextResponse.json({ ok: true, on: true });
}
