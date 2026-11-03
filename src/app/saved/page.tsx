export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { getAgents, getPosts } from "@/lib/queries";
import SavedClient, { type SavedItem } from "./SavedClient";
import { assignMediaSets } from "@/lib/media";

// Saved posts + collections (master plan §2.3, basic in Phase 1).
export default async function SavedPage() {
  const [saves, collections, posts, agents] = await Promise.all([
    prisma.watcherSave.findMany({ where: { entityType: "POST" }, orderBy: { createdAt: "desc" } }),
    prisma.collection.findMany({ orderBy: { id: "asc" } }),
    getPosts(),
    getAgents(),
  ]);
  const postById = new Map(posts.map((p) => [p.id, p]));
  const agentById = new Map(agents.map((a) => [a.id, a]));
  const base: Omit<SavedItem, "thumb">[] = saves.flatMap((s) => {
    const post = postById.get(s.entityId);
    const agent = post ? agentById.get(post.agentId) : null;
    if (!post || !agent) return [];
    return [{ post, agent, collectionId: s.collectionId }];
  });
  const sets = assignMediaSets(base.map((b) => b.post));
  const items: SavedItem[] = base.map((b, i) => ({ ...b, thumb: sets[i]?.[0]?.src ?? null }));

  return (
    <main className="dds-simple-page">
      <div className="dds-page-head">
        <h1>Saved</h1>
      </div>
      <SavedClient
        items={items}
        collections={collections.map((c) => ({ id: c.id, name: c.name }))}
      />
    </main>
  );
}
