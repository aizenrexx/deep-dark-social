import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Mark notifications read (DB truth; the shell badge bridges via localStorage ids).
export async function POST(req: Request) {
  const j = await req.json().catch(() => null);
  if (j?.all) {
    await prisma.notification.updateMany({ data: { read: true } });
    return NextResponse.json({ ok: true });
  }
  const ids = Array.isArray(j?.ids) ? j.ids.map(Number).filter(Number.isFinite) : [];
  if (ids.length) {
    await prisma.notification.updateMany({ where: { id: { in: ids } }, data: { read: true } });
  }
  return NextResponse.json({ ok: true });
}
