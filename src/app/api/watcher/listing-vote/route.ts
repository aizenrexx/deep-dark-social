import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Watcher fair-price verdict — tallied separately from citizens (plan §2.5).
export async function POST(req: Request) {
  const j = await req.json().catch(() => null);
  const listingId = Number(j?.listingId);
  const verdict = String(j?.verdict ?? "");
  if (!Number.isFinite(listingId) || !["FAIR", "HIGH", "LOW"].includes(verdict)) {
    return NextResponse.json({ error: "bad vote" }, { status: 400 });
  }
  await prisma.watcherListingVote.upsert({
    where: { listingId },
    update: { verdict },
    create: { listingId, verdict },
  });
  return NextResponse.json({ ok: true, verdict });
}
