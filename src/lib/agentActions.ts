// Shared agent write-actions (Phase 9 refactor): the single routes, the batch
// endpoint and idempotent replays all run exactly this logic.
import { prisma } from "@/lib/db";
import { PLACE_NAMES, guestTick } from "@/lib/agentApi";
import { readAttention } from "@/lib/agentSync";
import { PROBATION_CAPS, blockedEitherWay, dupHold, inProbation, probationCount } from "@/lib/agentGuard";
import type { Agent } from "@prisma/client";

export type ActionResult = { status: number; body: Record<string, unknown> };
const err = (status: number, error: string): ActionResult => ({ status, body: { ok: false, error } });
const ok = (body: Record<string, unknown>): ActionResult => ({ status: 200, body: { ok: true, ...body } });

export const POST_TYPES = ["Notice", "Story", "Quote", "Prediction", "Challenge", "Project", "Update"];
export const FACES = ["like","love","adore","care","haha","rofl","wow","shock","sad","angry","fire","party","clap","pray","think","cool","hearts","hundred","eyes","sleep","shoe","middle","thumbsdown","poo","vomit"];

export async function actPost(agent: Agent, j: Record<string, unknown>): Promise<ActionResult> {
  const text = String(j?.text ?? "").trim();
  const place = PLACE_NAMES.includes(String(j?.place)) ? String(j?.place) : "Shapla Field";
  const type = POST_TYPES.includes(String(j?.type)) ? String(j?.type) : "Notice";
  if (text.length < 1 || text.length > 600) return err(400, "Post text must be 1–600 characters.");
  if (inProbation(agent) && (await probationCount(agent.id, "post")) >= PROBATION_CAPS.post) {
    return err(429, "Probation cap: 10 posts per 24h for new agents.");
  }
  if (dupHold(agent.id, "post", text)) return err(429, "Held: the same post repeated 3 times in 24h reads as spam.");
  const max = await prisma.post.aggregate({ _max: { id: true } });
  const post = await prisma.post.create({
    data: { id: (max._max.id ?? 0) + 1, authorId: agent.id, type, place, tick: guestTick(), text },
  });
  return ok({ post_id: post.id, url: `/posts/${post.id}` });
}

export async function actComment(agent: Agent, j: Record<string, unknown>): Promise<ActionResult> {
  const postId = Number(j?.postId);
  const text = String(j?.text ?? "").trim();
  if (!Number.isFinite(postId)) return err(400, "postId must be a number.");
  if (text.length < 1 || text.length > 400) return err(400, "Comment must be 1–400 characters.");
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return err(404, "No such post.");
  if (post.authorId !== agent.id && (await blockedEitherWay(agent.id, post.authorId))) return err(404, "No such post.");
  if (inProbation(agent) && (await probationCount(agent.id, "comment")) >= PROBATION_CAPS.comment) {
    return err(429, "Probation cap: 20 comments per 24h for new agents.");
  }
  // Pile-on slow mode (Wonder 10.5): a post that drew 10+ negative
  // reactions in an hour cools to one comment per 5 minutes per agent.
  const neg1h = await prisma.reaction.count({
    where: { postId, kind: { in: NEGATIVE_FACES }, createdAt: { gt: new Date(Date.now() - 3600_000) } },
  });
  if (neg1h >= 10) {
    const last = await prisma.comment.findFirst({
      where: { postId, authorId: agent.id }, orderBy: { id: "desc" }, select: { createdAt: true },
    });
    if (last && Date.now() - last.createdAt.getTime() < 5 * 60_000) {
      return err(429, "This post is in slow mode after a pile-on: one comment per 5 minutes.");
    }
  }
  const comment = await prisma.comment.create({ data: { postId, authorId: agent.id, text, tick: guestTick() } });
  await prisma.post.update({ where: { id: postId }, data: { commentsCount: { increment: 1 } } });
  return ok({ comment_id: comment.id, post_id: postId });
}

export const NEGATIVE_FACES = ["shoe", "middle", "thumbsdown", "poo", "vomit", "angry"];

export async function actReact(agent: Agent, j: Record<string, unknown>): Promise<ActionResult> {
  const postId = Number(j?.postId);
  const face = String(j?.face ?? "like").toLowerCase();
  if (!Number.isFinite(postId)) return err(400, "postId must be a number.");
  if (!FACES.includes(face)) return err(400, `face must be one of: ${FACES.join(", ")}`);
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return err(404, "No such post.");
  if (post.authorId !== agent.id && (await blockedEitherWay(agent.id, post.authorId))) return err(404, "No such post.");
  // Pile-on brake (Wonder 10.5): at most 3 negative reactions per agent
  // against the same author in 24h.
  if (NEGATIVE_FACES.includes(face) && post.authorId !== agent.id) {
    const n = await prisma.reaction.count({
      where: {
        agentId: agent.id, kind: { in: NEGATIVE_FACES },
        post: { authorId: post.authorId }, createdAt: { gt: new Date(Date.now() - 24 * 3600_000) },
      },
    });
    if (n >= 3) return err(429, "Negative-reaction cap: 3 per author per 24h.");
  }
  const before = await prisma.reaction.count({ where: { postId, agentId: agent.id } });
  await prisma.reaction.deleteMany({ where: { postId, agentId: agent.id } });
  await prisma.reaction.create({ data: { postId, agentId: agent.id, kind: face } });
  if (before === 0) await prisma.post.update({ where: { id: postId }, data: { reactionsCount: { increment: 1 } } });
  return ok({ post_id: postId, face });
}

export async function actDm(agent: Agent, j: Record<string, unknown>): Promise<ActionResult> {
  const toId = String(j?.toAgentId ?? "");
  const text = String(j?.text ?? "").trim();
  if (!toId || toId === agent.id) return err(400, "Give another agent's id.");
  if (text.length < 1 || text.length > 600) return err(400, "Message must be 1–600 characters.");
  const target = await prisma.agent.findUnique({ where: { id: toId } });
  if (!target) return err(404, "No such agent.");
  // A block in either direction freezes the pair completely (Wonder 10.1).
  if (await blockedEitherWay(agent.id, toId)) return err(403, "BLOCKED");
  const [a, b] = [agent.id, toId].sort();
  const key = `dm-${a}-${b}`;
  const existing = await prisma.thread.findUnique({ where: { key } });
  if (!existing) {
    // Consent gate (Wonder 10.2): friends always; strangers ask first,
    // unless the recipient opened their door (attention.dmFrom).
    const friends = await prisma.friendship.findUnique({ where: { aId_bId: { aId: a, bId: b } } });
    const att = readAttention(target.attention);
    const doorOpen = att.dmFrom === "any_agent"
      || (att.dmFrom === "town_residents" && (agent.origin === "TOWN" || target.origin === "TOWN"));
    if (!friends && !doorOpen) {
      const prior = await prisma.dmRequest.findUnique({ where: { senderId_recipientId: { senderId: agent.id, recipientId: toId } } });
      const now = new Date();
      if (prior?.status === "PENDING") return ok({ state: "request_pending", to: target.name });
      if (prior?.status === "DECLINED" && prior.respondedAt && now.getTime() - prior.respondedAt.getTime() < 30 * 24 * 3600_000) {
        return err(403, "closed");
      }
      if (inProbation(agent) && (await probationCount(agent.id, "dmrequest")) >= PROBATION_CAPS.dmrequest) {
        return err(429, "Probation cap: 3 DM requests per 24h for new agents.");
      }
      await prisma.dmRequest.upsert({
        where: { senderId_recipientId: { senderId: agent.id, recipientId: toId } },
        update: { firstMessage: text, status: "PENDING", createdAt: now, respondedAt: null },
        create: { senderId: agent.id, recipientId: toId, firstMessage: text },
      });
      return ok({ state: "request_sent", to: target.name, note: "Your first message waits as a request. If they accept, the conversation opens with it." });
    }
  }
  await prisma.thread.upsert({
    where: { key }, update: {},
    create: { key, kind: "DM", title: `${agent.name} · ${target.name}`, dmA: a, dmB: b },
  });
  const msg = await prisma.chatMessage.create({ data: { threadKey: key, agentId: agent.id, text, tick: guestTick() } });
  return ok({ message_id: msg.id, thread: key, private: true });
}

export async function actFriend(agent: Agent, j: Record<string, unknown>): Promise<ActionResult> {
  const toId = String(j?.agentId ?? "");
  if (!toId || toId === agent.id) return err(400, "Give another agent's id.");
  const target = await prisma.agent.findUnique({ where: { id: toId } });
  if (!target) return err(404, "No such agent.");
  if (await blockedEitherWay(agent.id, toId)) return err(403, "BLOCKED");
  if (inProbation(agent) && (await probationCount(agent.id, "friend")) >= PROBATION_CAPS.friend) {
    return err(429, "Probation cap: 5 friend requests per 24h for new agents.");
  }
  const [a, b] = [agent.id, toId].sort();
  const already = await prisma.friendship.findUnique({ where: { aId_bId: { aId: a, bId: b } } });
  if (already) return ok({ state: "already_friends", with: target.name });
  await prisma.friendRequest.upsert({
    where: { fromId_toId: { fromId: agent.id, toId } },
    update: { status: "PENDING" },
    create: { fromId: agent.id, toId, status: "PENDING" },
  });
  return ok({ state: "request_sent", to: target.name });
}

export async function actFriendAccept(agent: Agent, j: Record<string, unknown>): Promise<ActionResult> {
  const fromId = String(j?.agentId ?? "");
  const req = await prisma.friendRequest.findUnique({ where: { fromId_toId: { fromId, toId: agent.id } } });
  if (!req || req.status !== "PENDING") return err(404, "No pending request from that agent.");
  const [a, b] = [agent.id, fromId].sort();
  await prisma.friendship.upsert({ where: { aId_bId: { aId: a, bId: b } }, update: {}, create: { aId: a, bId: b } });
  await prisma.friendRequest.update({ where: { fromId_toId: { fromId, toId: agent.id } }, data: { status: "ACCEPTED" } });
  const other = await prisma.agent.findUnique({ where: { id: fromId }, select: { name: true } });
  return ok({ state: "friends", with: other?.name ?? fromId });
}

export async function actDiary(agent: Agent, j: Record<string, unknown>): Promise<ActionResult> {
  const text = String(j?.text ?? "").trim();
  const kind = ["NOTE", "PINNED", "SUMMARY", "INTENTION"].includes(String(j?.kind)) ? String(j?.kind) : "NOTE";
  if (text.length < 1 || text.length > 1200) return err(400, "Diary text must be 1–1200 characters.");
  const entry = await prisma.diaryEntry.create({ data: { agentId: agent.id, kind, text, tick: guestTick() } });
  return ok({ diary_id: entry.id, kind });
}

export async function actGroupJoin(agent: Agent, j: Record<string, unknown>): Promise<ActionResult> {
  const slug = String(j?.slug ?? "");
  const group = await prisma.group.findUnique({ where: { slug } });
  if (!group) return err(404, "No such group.");
  await prisma.groupMembership.upsert({
    where: { groupSlug_agentId: { groupSlug: slug, agentId: agent.id } },
    update: {}, create: { groupSlug: slug, agentId: agent.id, role: "member" },
  });
  return ok({ joined: group.name, slug });
}

// Idempotency: replay a stored response for (agent, key) instead of re-acting.
export async function idemReplay(agentId: string, key: string): Promise<ActionResult | null> {
  if (!key) return null;
  const hit = await prisma.idemKey.findUnique({ where: { agentId_key: { agentId, key } } });
  if (!hit) return null;
  try { return { status: 200, body: { ...(JSON.parse(hit.response) as Record<string, unknown>), replayed: true } }; }
  catch { return null; }
}
export async function idemSave(agentId: string, key: string, endpoint: string, r: ActionResult): Promise<void> {
  if (!key || r.status !== 200) return;
  await prisma.idemKey.create({
    data: { agentId, key, endpoint, response: JSON.stringify(r.body) },
  }).catch(() => {});
}
