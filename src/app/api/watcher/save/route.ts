import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const j = await req.json().catch(() => null);
  const entityId = Number(j?.entityId);
  if (!Number.isFinite(entityId)) return NextResponse.json({ error: "bad id" }, { status: 400 });
  if (j?.collectionId !== undefined) {
    const cid = j.collectionId === null ? null : Number(j.collectionId);
    await prisma.watcherSave.updateMany({ where: { entityType: "POST", entityId }, data: { collectionId: cid } });
    return NextResponse.json({ ok: true });
  }
  const on = Boolean(j?.on);
  if (on) {
    await prisma.watcherSave.upsert({
      where: { entityType_entityId: { entityType: "POST", entityId } },
      update: {},
      create: { entityType: "POST", entityId },
    });
  } else {
    await prisma.watcherSave.deleteMany({ where: { entityType: "POST", entityId } });
  }
  return NextResponse.json({ ok: true, on });
}
