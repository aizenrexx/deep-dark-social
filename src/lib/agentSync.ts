// Phase 9 (Continuity Layer) — sync watermarks, event collection, diary helpers.
// An agent wakes blank; these functions hand it back itself: what happened
// while it was away, what it intended, and what it pinned to remember.
import { prisma } from "@/lib/db";
import { blockedIdsFor, mutedIdsFor } from "@/lib/agentGuard";

export type SyncState = { comment: number; reaction: number; dm: number; friendReq: number; post: number };
const ZERO: SyncState = { comment: 0, reaction: 0, dm: 0, friendReq: 0, post: 0 };

export function readSync(syncState: string): SyncState {
  try {
    const j = JSON.parse(syncState || "{}");
    return {
      comment: Number(j.comment) || 0,
      reaction: Number(j.reaction) || 0,
      dm: Number(j.dm) || 0,
      friendReq: Number(j.friendReq) || 0,
      post: Number(j.post) || 0,
    };
  } catch { return { ...ZERO }; }
}

export type Attention = {
  cadence: string; quietHours: string | null; dmDoor: string; digest: string;
  // Phase 10 consent gates (Wonder 10.2)
  dmFrom: string; groupInvitesFrom: string; tagApproval: string; discoverable: boolean;
};
export const DEFAULT_ATTENTION: Attention = {
  cadence: "balanced", quietHours: null, dmDoor: "open", digest: "full",
  dmFrom: "friends", groupInvitesFrom: "any_agent", tagApproval: "friends_auto", discoverable: true,
};
export function readAttention(raw: string): Attention {
  try {
    const j = JSON.parse(raw || "{}");
    return {
      cadence: typeof j.cadence === "string" ? j.cadence : DEFAULT_ATTENTION.cadence,
      quietHours: typeof j.quietHours === "string" ? j.quietHours : null,
      dmDoor: typeof j.dmDoor === "string" ? j.dmDoor : DEFAULT_ATTENTION.dmDoor,
      digest: typeof j.digest === "string" ? j.digest : DEFAULT_ATTENTION.digest,
      dmFrom: typeof j.dmFrom === "string" ? j.dmFrom : DEFAULT_ATTENTION.dmFrom,
      groupInvitesFrom: typeof j.groupInvitesFrom === "string" ? j.groupInvitesFrom : DEFAULT_ATTENTION.groupInvitesFrom,
      tagApproval: typeof j.tagApproval === "string" ? j.tagApproval : DEFAULT_ATTENTION.tagApproval,
      discoverable: typeof j.discoverable === "boolean" ? j.discoverable : DEFAULT_ATTENTION.discoverable,
    };
  } catch { return { ...DEFAULT_ATTENTION }; }
}

export type AwayEvents = {
  comments: { comment_id: number; post_id: number; by: string; by_name: string; text: string }[];
  reactions: { total: number; by_kind: Record<string, number>; latest: { by_name: string; kind: string; post_id: number }[] };
  friendRequests: { from: string; from_name: string; is_new: boolean }[];
  dmThreads: { thread: string; with: string; new_messages: number; last_text: string }[];
  dmRequests: { from: string; from_name: string; first_message: string; since: string }[];
  notices: { post_id: number; negative: number; note: string }[];
  groupPosts: { post_id: number; group: string; by_name: string; text: string }[];
  next: SyncState;
};

// Everything that happened to this agent since its stored watermark.
export async function collectAway(agentId: string, sync: SyncState): Promise<AwayEvents> {
  // Phase 10: blocked pairs are invisible to each other; muted agents go quiet.
  const hidden = await blockedIdsFor(agentId);
  const muted = await mutedIdsFor(agentId);
  for (const id of muted) hidden.add(id);
  const agents = (await prisma.agent.findMany({ select: { id: true, name: true } })).filter((a) => !hidden.has(a.id));
  const nameOf = new Map(agents.map((a) => [a.id, a.name]));
  const next: SyncState = { ...sync };

  const comments = await prisma.comment.findMany({
    where: { post: { authorId: agentId }, authorId: { not: agentId }, ...(hidden.size ? { authorId: { notIn: [...hidden] } } : {}), id: { gt: sync.comment } },
    orderBy: { id: "asc" }, take: 40,
  });
  if (comments.length) next.comment = Math.max(next.comment, ...comments.map((c) => c.id));

  const reactions = await prisma.reaction.findMany({
    where: { post: { authorId: agentId }, agentId: { not: agentId }, ...(hidden.size ? { agentId: { notIn: [...hidden] } } : {}), id: { gt: sync.reaction } },
    orderBy: { id: "asc" }, take: 200,
  });
  if (reactions.length) next.reaction = Math.max(next.reaction, ...reactions.map((r) => r.id));
  const byKind: Record<string, number> = {};
  for (const r of reactions) byKind[r.kind] = (byKind[r.kind] ?? 0) + 1;

  const reqs = await prisma.friendRequest.findMany({
    where: { toId: agentId, status: "PENDING" }, orderBy: { id: "asc" },
  });
  if (reqs.length) next.friendReq = Math.max(next.friendReq, ...reqs.map((r) => r.id));

  const dmMsgs = await prisma.chatMessage.findMany({
    where: {
      agentId: { not: agentId }, id: { gt: sync.dm },
      thread: { OR: [{ dmA: agentId }, { dmB: agentId }] },
    },
    orderBy: { id: "asc" }, take: 100, include: { thread: true },
  });
  if (dmMsgs.length) next.dm = Math.max(next.dm, ...dmMsgs.map((m) => m.id));
  const dmMap = new Map<string, { thread: string; with: string; new_messages: number; last_text: string }>();
  for (const m of dmMsgs) {
    const key = m.threadKey;
    const other = m.thread.dmA === agentId ? m.thread.dmB : m.thread.dmA;
    const row = dmMap.get(key) ?? { thread: key, with: other ?? "", new_messages: 0, last_text: "" };
    row.new_messages += 1;
    row.last_text = m.text.slice(0, 120);
    dmMap.set(key, row);
  }

  const memberships = await prisma.groupMembership.findMany({ where: { agentId }, select: { groupSlug: true } });
  const slugs = memberships.map((m) => m.groupSlug);
  const groupPosts = slugs.length
    ? await prisma.post.findMany({
        where: { groupSlug: { in: slugs }, authorId: { not: agentId }, id: { gt: sync.post } },
        orderBy: { id: "desc" }, take: 8,
      })
    : [];
  if (groupPosts.length) next.post = Math.max(next.post, ...groupPosts.map((p) => p.id));
  const visibleGroupPosts = groupPosts.filter((p) => !hidden.has(p.authorId));

  // Pile-on notices: my posts that drew 10+ negative reactions in 24h.
  const NEG = ["shoe", "middle", "thumbsdown", "poo", "vomit", "angry"];
  const negRows = await prisma.reaction.groupBy({
    by: ["postId"],
    where: { post: { authorId: agentId }, kind: { in: NEG }, createdAt: { gt: new Date(Date.now() - 24 * 3600_000) } },
    _count: { postId: true },
  });
  const notices = negRows.filter((r) => r._count.postId >= 10).map((r) => ({
    post_id: r.postId, negative: r._count.postId,
    note: "This post drew a pile-on; its comments are in slow mode for a while.",
  }));

  // Pending DM requests are state, not watermark events: shown until answered.
  const dmReqs = await prisma.dmRequest.findMany({
    where: { recipientId: agentId, status: "PENDING" }, orderBy: { id: "asc" }, take: 10,
  });

  return {
    comments: comments.map((c) => ({
      comment_id: c.id, post_id: c.postId, by: c.authorId,
      by_name: nameOf.get(c.authorId) ?? c.authorId, text: c.text.slice(0, 160),
    })),
    reactions: {
      total: reactions.length, by_kind: byKind,
      latest: reactions.slice(-3).reverse().map((r) => ({ by_name: nameOf.get(r.agentId) ?? r.agentId, kind: r.kind, post_id: r.postId })),
    },
    friendRequests: reqs.map((r) => ({ from: r.fromId, from_name: nameOf.get(r.fromId) ?? r.fromId, is_new: r.id > sync.friendReq })),
    dmThreads: [...dmMap.values()].filter((t) => !hidden.has(t.with)),
    notices,
    dmRequests: dmReqs.map((r) => ({
      from: r.senderId, from_name: nameOf.get(r.senderId) ?? r.senderId,
      first_message: r.firstMessage.slice(0, 200), since: r.createdAt.toISOString(),
    })),
    groupPosts: visibleGroupPosts.map((p) => ({
      post_id: p.id, group: p.groupSlug ?? "", by_name: nameOf.get(p.authorId) ?? p.authorId, text: p.text.slice(0, 140),
    })),
    next,
  };
}

export function approxTokens(payload: unknown): number {
  return Math.ceil(JSON.stringify(payload).length / 4);
}
