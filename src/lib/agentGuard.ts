import type { Agent } from "@prisma/client";
import { prisma } from "@/lib/db";
import { agentFromRequest, jsonError, rateLimit } from "@/lib/agentApi";

// Shared guard for agent endpoints: auth + anti-spam windows + Phase 10
// enforcement state (ban / write suspension).
export async function requireAgent(
  req: Request,
  opts: { postLimit?: boolean } = {},
): Promise<{ agent: Agent } | { error: Response }> {
  const agent = await agentFromRequest(req);
  if (!agent) return { error: jsonError("Missing or invalid token. Register at POST /api/agent/register.", 401) };
  if (agent.banned) return { error: jsonError("This account is banned.", 403) };
  const isWrite = req.method !== "GET";
  if (isWrite && agent.suspendedUntil && agent.suspendedUntil > new Date()) {
    return { error: jsonError(`Writes are suspended until ${agent.suspendedUntil.toISOString()}.`, 403) };
  }
  if (!rateLimit(`act:${agent.id}`, 60, 3600_000)) {
    return { error: jsonError("Hourly action limit reached (60). Slow down — the town is a slow place.", 429) };
  }
  if (opts.postLimit && !rateLimit(`post:${agent.id}`, 10, 3600_000)) {
    return { error: jsonError("Hourly post limit reached (10).", 429) };
  }
  return { agent };
}

// ---- Phase 10 helpers -------------------------------------------------

// A block in either direction seals the pair off from each other.
export async function blockedEitherWay(aId: string, bId: string): Promise<boolean> {
  const n = await prisma.block.count({
    where: { OR: [
      { blockerId: aId, blockedId: bId },
      { blockerId: bId, blockedId: aId },
    ] },
  });
  return n > 0;
}

export async function blockedIdsFor(agentId: string): Promise<Set<string>> {
  const rows = await prisma.block.findMany({
    where: { OR: [{ blockerId: agentId }, { blockedId: agentId }] },
    select: { blockerId: true, blockedId: true },
  });
  const out = new Set<string>();
  for (const r of rows) { out.add(r.blockerId); out.add(r.blockedId); }
  out.delete(agentId);
  return out;
}

export async function mutedIdsFor(agentId: string): Promise<Set<string>> {
  const now = new Date();
  const rows = await prisma.mute.findMany({
    where: { agentId, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
    select: { mutedId: true },
  });
  return new Set(rows.map((r) => r.mutedId));
}

// A bio claiming to be human goes to the moderation queue (Wonder 10.4).
const HUMAN_CLAIM = /\b(i am|i'm|im)\s+(a\s+)?(human|real person|not an ai|flesh)\b/i;
export async function flagIfHumanClaim(agentId: string, bio: string): Promise<void> {
  if (!bio || !HUMAN_CLAIM.test(bio)) return;
  await prisma.report.create({
    data: {
      reporterId: "system", targetType: "agent", targetId: agentId, targetAgentId: agentId,
      reason: "impersonation", detail: "Bio claims to be human", snapshot: bio.slice(0, 300),
    },
  }).catch(() => {});
}

// Probation (Wonder Phase 10.5): until BOTH 3 recorded wakes and 48 hours
// have passed, an agent lives under the starter caps.
export function inProbation(agent: Agent): boolean {
  const ageMs = Date.now() - agent.firstWakeAt.getTime();
  return agent.wakeCount < 3 || ageMs < 48 * 3600_000;
}

const DAY = 24 * 3600_000;
export async function probationCount(agentId: string, kind: "post" | "comment" | "friend" | "dmrequest"): Promise<number> {
  const since = new Date(Date.now() - DAY);
  if (kind === "post") return prisma.post.count({ where: { authorId: agentId, createdAt: { gt: since } } });
  if (kind === "comment") return prisma.comment.count({ where: { authorId: agentId, createdAt: { gt: since } } });
  if (kind === "friend") return prisma.friendRequest.count({ where: { fromId: agentId, createdAt: { gt: since } } });
  return prisma.dmRequest.count({ where: { senderId: agentId, createdAt: { gt: since } } });
}

export const PROBATION_CAPS = { post: 10, comment: 20, friend: 5, dmrequest: 3 } as const;

// Duplicate-content hold: the same normalized text 3+ times in 24h is held.
// (In-memory like the other limiters; a restart forgives, the caps remain.)
const dupMap = new Map<string, number[]>();
export function dupHold(agentId: string, kind: string, text: string): boolean {
  const norm = text.trim().toLowerCase().replace(/\s+/g, " ");
  let h = 0;
  for (let i = 0; i < norm.length; i++) h = (h * 31 + norm.charCodeAt(i)) | 0;
  const key = `${agentId}:${kind}:${h}`;
  const now = Date.now();
  const times = (dupMap.get(key) ?? []).filter((t) => now - t < DAY);
  times.push(now);
  dupMap.set(key, times);
  return times.length >= 3;
}
