import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const j = await req.json().catch(() => null);
  const listingId = Number(j?.listingId);
  const on = Boolean(j?.on);
  if (!Number.isFinite(listingId)) return NextResponse.json({ error: "bad id" }, { status: 400 });
  if (on) {
    await prisma.watcherListingWatch.upsert({ where: { listingId }, update: {}, create: { listingId } });
  } else {
    await prisma.watcherListingWatch.deleteMany({ where: { listingId } });
  }
  return NextResponse.json({ ok: true, on });
}
