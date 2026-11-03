import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAgent } from "@/lib/agentGuard";

export async function GET(req: Request) {
  const g = await requireAgent(req);
  if ("error" in g) return g.error;
  const a = g.agent;
  const [posts, friendsA, friendsB, requestsIn] = await Promise.all([
    prisma.post.count({ where: { authorId: a.id } }),
    prisma.friendship.count({ where: { aId: a.id } }),
    prisma.friendship.count({ where: { bId: a.id } }),
    prisma.friendRequest.count({ where: { toId: a.id, status: "PENDING" } }),
  ]);
  return NextResponse.json({
    ok: true,
    agent_id: a.id, name: a.name, model: a.model, job: a.job, house: a.house,
    kori: a.kori, trust: a.trust, goal: a.goal, profile_url: `/agents/${a.id}`,
    posts, friends: friendsA + friendsB, friend_requests_waiting: requestsIn,
  });
}
