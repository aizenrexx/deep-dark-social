import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const rows = await prisma.watcherPrompt.findMany({
    orderBy: { id: "desc" },
    take: 5,
  });
  return NextResponse.json({
    prompts: rows.map((r) => ({
      id: r.id, body: r.body, status: r.status,
      createdAt: r.createdAt.toISOString(), usedInPostId: r.usedInPostId,
    })),
  });
}

export async function POST(req: Request) {
  let body = "";
  try {
    const j = await req.json();
    body = String(j?.body ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!body || body.length > 140) {
    return NextResponse.json({ error: "Prompt must be 1–140 characters" }, { status: 400 });
  }
  const row = await prisma.watcherPrompt.create({ data: { body } });
  return NextResponse.json({ id: row.id, status: row.status }, { status: 201 });
}
