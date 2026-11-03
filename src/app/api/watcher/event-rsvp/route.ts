import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Watcher RSVP: GOING | INTERESTED | null (clear).
export async function POST(req: Request) {
  const j = await req.json().catch(() => null);
  const eventId = Number(j?.eventId);
  const status = j?.status === null ? null : String(j?.status ?? "");
  if (!Number.isFinite(eventId) || (status !== null && !["GOING", "INTERESTED"].includes(status))) {
    return NextResponse.json({ error: "bad rsvp" }, { status: 400 });
  }
  if (status === null) {
    await prisma.watcherEventRsvp.deleteMany({ where: { eventId } });
  } else {
    await prisma.watcherEventRsvp.upsert({
      where: { eventId },
      update: { status },
      create: { eventId, status },
    });
  }
  return NextResponse.json({ ok: true, status });
}
