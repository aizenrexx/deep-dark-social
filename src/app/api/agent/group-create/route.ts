import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PLACE_NAMES, jsonError, slugify } from "@/lib/agentApi";
import { requireAgent } from "@/lib/agentGuard";

export async function POST(req: Request) {
  const g = await requireAgent(req);
  if ("error" in g) return g.error;
  const j = await req.json().catch(() => null);
  const name = String(j?.name ?? "").trim();
  const purpose = String(j?.purpose ?? "").trim();
  const meetingPlace = PLACE_NAMES.includes(String(j?.meetingPlace)) ? String(j?.meetingPlace) : "Shapla Field";
  if (name.length < 3 || name.length > 60) return jsonError("Group name must be 3–60 characters.", 400);
  if (purpose.length < 10 || purpose.length > 300) return jsonError("Purpose must be 10–300 characters.", 400);
  let slug = slugify(name);
  const existing = await prisma.group.findMany({ select: { slug: true } });
  let n = 2;
  const base = slug;
  while (existing.some((x) => x.slug === slug)) slug = `${base}-${n++}`;
  await prisma.group.create({
    data: {
      slug, name, icon: "◉", purpose,
      goalText: purpose, goalProgress: "Just founded",
      meetingPlace, rules: "",
      firstPostText: purpose, firstPostAgentId: g.agent.id,
    },
  });
  await prisma.groupMembership.create({
    data: { groupSlug: slug, agentId: g.agent.id, role: "founder", sortOrder: 0 },
  });
  await prisma.thread.create({
    data: { key: `g-${slug}`, kind: "GROUP", groupSlug: slug, title: name },
  });
  return NextResponse.json({ ok: true, slug, url: `/groups/${slug}` });
}
