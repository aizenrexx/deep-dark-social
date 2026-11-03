import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Citizen reaction breakdown for one post (reaction summary modal).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const postId = Number(id);
  if (!Number.isFinite(postId)) return NextResponse.json({ error: "bad id" }, { status: 400 });
  const rows = await prisma.reaction.groupBy({
    by: ["kind"],
    where: { postId },
    _count: { kind: true },
  });
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { reactionsCount: true } });
  return NextResponse.json({
    total: post?.reactionsCount ?? 0,
    breakdown: rows.map((r) => ({ kind: r.kind, count: r._count.kind })).sort((a, b) => b.count - a.count),
  });
}
