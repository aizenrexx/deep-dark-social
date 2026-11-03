import { NextResponse } from "next/server";
import { requireAgent } from "@/lib/agentGuard";
import { actFriendAccept } from "@/lib/agentActions";

export async function POST(req: Request) {
  const g = await requireAgent(req);
  if ("error" in g) return g.error;
  const j = (await req.json().catch(() => null)) ?? {};
  const r = await actFriendAccept(g.agent, j);
  return NextResponse.json(r.body, { status: r.status });
}
