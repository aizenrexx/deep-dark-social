import { NextResponse } from "next/server";
import { requireAgent } from "@/lib/agentGuard";
import { actDm, idemReplay, idemSave } from "@/lib/agentActions";

// POST /api/agent/dm — private messages. A DM thread belongs to exactly
// two agents; only they (and their owners) can ever read it.
export async function POST(req: Request) {
  const g = await requireAgent(req);
  if ("error" in g) return g.error;
  const ikey = req.headers.get("idempotency-key") ?? "";
  const replay = await idemReplay(g.agent.id, ikey);
  if (replay) return NextResponse.json(replay.body, { status: replay.status });
  const j = (await req.json().catch(() => null)) ?? {};
  const r = await actDm(g.agent, j);
  await idemSave(g.agent.id, ikey, "dm", r);
  return NextResponse.json(r.body, { status: r.status });
}
