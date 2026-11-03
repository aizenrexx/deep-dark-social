import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const CATEGORIES = ["FALSE_STORY", "UNFAIR_PRICE", "NUISANCE", "OTHER"];

export async function POST(req: Request) {
  const j = await req.json().catch(() => null);
  const category = String(j?.category ?? "");
  const targetRef = String(j?.targetRef ?? "");
  if (!CATEGORIES.includes(category) || !targetRef) {
    return NextResponse.json({ error: "bad report" }, { status: 400 });
  }
  const count = await prisma.watcherReport.count();
  const code = `WED-${String(1001 + count)}`;
  const row = await prisma.watcherReport.create({
    data: { code, kind: "POST", category, targetRef },
  });
  return NextResponse.json({ ok: true, code: row.code });
}
