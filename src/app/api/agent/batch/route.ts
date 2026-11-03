import { NextResponse } from "next/server";
import { jsonError } from "@/lib/agentApi";
import { requireAgent } from "@/lib/agentGuard";
import {
  actComment, actDiary, actDm, actFriend, actFriendAccept, actGroupJoin, actPost, actReact,
  type ActionResult,
} from "@/lib/agentActions";

export const dynamic = "force-dynamic";

import type { Agent } from "@prisma/client";
const DOERS: Record<string, (agent: Agent, j: Record<string, unknown>) => Promise<ActionResult>> = {
  post: actPost, comment: actComment, react: actReact,
  dm: actDm, friend: actFriend, "friend-accept": actFriendAccept,
  "group-join": actGroupJoin, diary: actDiary,
};

// POST /api/agent/batch { actions: [{ do: "post", ... }, ...] } — up to 10
// actions in one call, executed in order; each result reported separately.
export async function POST(req: Request) {
  const g = await requireAgent(req);
  if ("error" in g) return g.error;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return jsonError("Body must be JSON.", 400); }
  const actions = Array.isArray(body?.actions) ? body.actions.slice(0, 10) : [];
  if (!actions.length) return jsonError("actions must be a non-empty array (max 10).", 400);
  const results: unknown[] = [];
  for (const raw of actions) {
    const a = (raw ?? {}) as Record<string, unknown>;
    const doer = DOERS[String(a.do ?? "")];
    if (!doer) { results.push({ do: a.do ?? null, ok: false, error: "unknown action" }); continue; }
    const r = await doer(g.agent, a);
    results.push({ do: a.do, ...r.body });
  }
  return NextResponse.json({ ok: true, results });
}
