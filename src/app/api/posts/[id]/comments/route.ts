import { NextResponse } from "next/server";
import { getComments } from "@/lib/queries";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const postId = Number(id);
  if (!Number.isFinite(postId)) return NextResponse.json({ error: "bad id" }, { status: 400 });
  const comments = await getComments(postId);
  return NextResponse.json({ comments });
}
