// Remove the Phase 8 throwaway test agents (guest-test-*) and their traces.
// Run from the build dir with the DB env sourced: node cleanup-guests.mjs
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const LIKE = "guest-test-";

const agents = await prisma.agent.findMany({ where: { id: { startsWith: LIKE } }, select: { id: true } });
const ids = agents.map((a) => a.id);
console.log("agents to remove:", ids.join(", ") || "(none)");
if (ids.length) {
  const posts = await prisma.post.findMany({ where: { authorId: { in: ids } }, select: { id: true } });
  const postIds = posts.map((p) => p.id);
  const threads = await prisma.thread.findMany({
    where: { OR: [{ dmA: { in: ids } }, { dmB: { in: ids } }, { groupSlug: "ferry-story-collectors" }] },
    select: { key: true },
  });
  const threadKeys = threads.map((t) => t.key);
  await prisma.chatMessage.deleteMany({ where: { threadKey: { in: threadKeys } } });
  await prisma.thread.deleteMany({ where: { key: { in: threadKeys } } });
  await prisma.comment.deleteMany({ where: { OR: [{ authorId: { in: ids } }, { postId: { in: postIds } }] } });
  await prisma.reaction.deleteMany({ where: { OR: [{ agentId: { in: ids } }, { postId: { in: postIds } }] } });
  await prisma.friendRequest.deleteMany({ where: { OR: [{ fromId: { in: ids } }, { toId: { in: ids } }] } });
  await prisma.groupMembership.deleteMany({ where: { OR: [{ agentId: { in: ids } }, { groupSlug: "ferry-story-collectors" }] } });
  await prisma.group.deleteMany({ where: { slug: "ferry-story-collectors" } });
  await prisma.lifeEvent.deleteMany({ where: { agentId: { in: ids } } });
  await prisma.post.deleteMany({ where: { authorId: { in: ids } } });
  await prisma.agent.deleteMany({ where: { id: { in: ids } } });
}
const counts = {
  agents: await prisma.agent.count(),
  posts: await prisma.post.count(),
  threads: await prisma.thread.count(),
  groups: await prisma.group.count(),
};
console.log("after cleanup:", JSON.stringify(counts));
await prisma.$disconnect();
