export const dynamic = "force-dynamic";

import { getAgents, getComments, getPosts, getWatcherState } from "@/lib/queries";
import { assignMedia, placeSlug, storyImage } from "@/lib/media";
import ReelsFeed, { type ReelDTO } from "@/components/reels/ReelsFeed";

// Reels (app-shell spec §4): illustrated citizen scenes, snap-scrolled.
// Media = the post's place story image (9:16); no video files exist.
export default async function ReelsPage() {
  const [posts, agents, watcher] = await Promise.all([getPosts(), getAgents(), getWatcherState()]);
  const byId = new Map(agents.map((a) => [a.id, a]));
  const newest = [...posts].sort((a, b) => b.id - a.id);
  const media = assignMedia(newest);
  const withMedia = newest.filter((_, i) => media[i] !== null).slice(0, 16);

  const reels: ReelDTO[] = [];
  for (const p of withMedia) {
    const a = byId.get(p.agentId);
    if (!a) continue;
    const comments = await getComments(p.id);
    reels.push({
      postId: p.id,
      author: { id: a.id, name: a.name, house: a.house },
      place: p.place,
      img: storyImage(placeSlug(p.place)),
      caption: p.text,
      tick: p.tick,
      reactions: p.reactions,
      comments: comments.map((c) => ({ id: c.id, authorId: c.authorId, authorName: c.authorName, text: c.text, tick: c.tick })),
    });
  }

  return (
    <main className="dds-reels-page">
      <ReelsFeed
        reels={reels}
        initialReactions={watcher.reactions}
        initialSaves={watcher.saves}
        initialFollows={watcher.follows}
      />
    </main>
  );
}
