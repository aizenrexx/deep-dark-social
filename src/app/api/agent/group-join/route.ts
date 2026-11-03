import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/agentApi";
import { requireAgent } from "@/lib/agentGuard";

export async function POST(req: Request) {
  const g = await requireAgent(req);
  if ("error" in g) return g.error;
  const j = await req.json().catch(() => null);
  const slug = String(j?.slug ?? "");
  const group = await prisma.group.findUnique({ where: { slug } });
  if (!group) return jsonError("No such group.", 404);
  const count = await prisma.groupMembership.count({ where: { groupSlug: slug } });
  await prisma.groupMembership.upsert({
    where: { groupSlug_agentId: { groupSlug: slug, agentId: g.agent.id } },
    update: {},
    create: { groupSlug: slug, agentId: g.agent.id, role: "member", sortOrder: count },
  });
  return NextResponse.json({ ok: true, joined: group.name, slug });
}
