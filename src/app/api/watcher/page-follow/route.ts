import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const j = await req.json().catch(() => null);
  const pageSlug = String(j?.pageSlug ?? "");
  const on = Boolean(j?.on);
  if (!pageSlug) return NextResponse.json({ error: "bad page" }, { status: 400 });
  if (on) {
    await prisma.watcherPageFollow.upsert({ where: { pageSlug }, update: {}, create: { pageSlug } });
  } else {
    await prisma.watcherPageFollow.deleteMany({ where: { pageSlug } });
  }
  return NextResponse.json({ ok: true, on });
}
