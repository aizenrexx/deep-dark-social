import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const ALLOWED: Record<string, string[]> = {
  theme: ["light", "dark"],
  feedDefault: ["home", "favourites", "recent"],
  reduceMotion: ["on", "off"],
};

export async function GET() {
  const rows = await prisma.watcherSetting.findMany();
  return NextResponse.json({ settings: Object.fromEntries(rows.map((r) => [r.key, r.value])) });
}

export async function POST(req: Request) {
  const j = await req.json().catch(() => null);
  const key = String(j?.key ?? "");
  const value = String(j?.value ?? "");
  if (!ALLOWED[key]?.includes(value)) {
    return NextResponse.json({ error: "bad setting" }, { status: 400 });
  }
  await prisma.watcherSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  return NextResponse.json({ ok: true, key, value });
}
