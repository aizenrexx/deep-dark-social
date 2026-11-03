import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const j = await req.json().catch(() => null);
  const action = String(j?.action ?? "");
  if (action === "create") {
    const name = String(j?.name ?? "").trim();
    if (!name || name.length > 40) return NextResponse.json({ error: "bad name" }, { status: 400 });
    const row = await prisma.collection.create({ data: { name } });
    return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
  }
  if (action === "rename") {
    const id = Number(j?.id);
    const name = String(j?.name ?? "").trim();
    if (!Number.isFinite(id) || !name) return NextResponse.json({ error: "bad rename" }, { status: 400 });
    await prisma.collection.update({ where: { id }, data: { name } });
    return NextResponse.json({ ok: true });
  }
  if (action === "delete") {
    const id = Number(j?.id);
    if (!Number.isFinite(id)) return NextResponse.json({ error: "bad id" }, { status: 400 });
    await prisma.collection.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "bad action" }, { status: 400 });
}
