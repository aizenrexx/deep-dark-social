import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const TYPES = ["LIKE","LOVE","ADORE","CARE","HAHA","ROFL","WOW","SHOCK","SAD","ANGRY","FIRE","PARTY","CLAP","PRAY","THINK","COOL","HEARTS","HUNDRED","EYES","SLEEP","SHOE","MIDDLE","THUMBSDOWN","POO","VOMIT"];

export async function POST(req: Request) {
  const j = await req.json().catch(() => null);
  const targetId = Number(j?.targetId);
  const type = j?.type ? String(j.type) : null;
  if (!Number.isFinite(targetId)) return NextResponse.json({ error: "bad target" }, { status: 400 });
  if (type === null) {
    await prisma.watcherReaction.deleteMany({ where: { targetType: "POST", targetId } });
    return NextResponse.json({ ok: true, type: null });
  }
  if (!TYPES.includes(type)) return NextResponse.json({ error: "bad type" }, { status: 400 });
  await prisma.watcherReaction.upsert({
    where: { targetType_targetId: { targetType: "POST", targetId } },
    update: { type },
    create: { targetType: "POST", targetId, type },
  });
  return NextResponse.json({ ok: true, type });
}
