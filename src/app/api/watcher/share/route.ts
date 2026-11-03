import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Boost signal: the watcher's one share per post (master plan SOC-12).
export async function POST(req: Request) {
  const j = await req.json().catch(() => null);
  const postId = Number(j?.postId);
  if (!Number.isFinite(postId)) return NextResponse.json({ error: "bad id" }, { status: 400 });
  const existing = await prisma.watcherShare.findUnique({ where: { postId } });
  if (existing) {
    await prisma.watcherShare.delete({ where: { postId } });
    return NextResponse.json({ ok: true, boosted: false });
  }
  await prisma.watcherShare.create({ data: { postId } });
  return NextResponse.json({ ok: true, boosted: true });
}
