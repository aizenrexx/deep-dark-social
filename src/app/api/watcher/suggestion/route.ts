import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const j = await req.json().catch(() => null);
  const targetRef = String(j?.targetRef ?? "").trim();
  const text = String(j?.text ?? "").trim();
  if (!targetRef || !text || text.length > 200) {
    return NextResponse.json({ error: "bad suggestion" }, { status: 400 });
  }
  const row = await prisma.watcherSuggestion.create({
    data: { kind: "GROUP_TOPIC", targetRef, text },
  });
  return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
}
