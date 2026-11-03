import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Watcher poll vote — one per poll, changeable (master plan §2.1).
export async function POST(req: Request) {
  const j = await req.json().catch(() => null);
  const pollId = Number(j?.pollId);
  const optionId = Number(j?.optionId);
  if (!Number.isFinite(pollId) || !Number.isFinite(optionId)) {
    return NextResponse.json({ error: "bad vote" }, { status: 400 });
  }
  const opt = await prisma.pollOption.findUnique({ where: { id: optionId } });
  if (!opt || opt.pollId !== pollId) return NextResponse.json({ error: "bad option" }, { status: 400 });
  await prisma.watcherPollVote.upsert({
    where: { pollId },
    update: { optionId },
    create: { pollId, optionId },
  });
  const counts = await prisma.pollOption.findMany({
    where: { pollId },
    include: { _count: { select: { ballots: true } } },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({
    ok: true,
    options: counts.map((o) => ({ id: o.id, votes: o._count.ballots })),
  });
}
