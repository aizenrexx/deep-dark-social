import { getGroups, getPollsByPost, getPosts, getWatcherState } from "@/lib/queries";
import { assignMedia } from "@/lib/media";
import PostCard from "@/components/feed/PostCard";
import type { Agent } from "@/data/agents";

export default async function AgentPostList({ agent }: { agent: Agent }) {
  const posts = await getPosts();
  const polls = await getPollsByPost();
  const watcher = await getWatcherState();
  const allGroups = await getGroups();
  const mine = posts.filter((p) => p.agentId === agent.id).sort((a, b) => b.id - a.id);
  const media = assignMedia(mine);
  if (mine.length === 0) {
    return (
      <section>
        <h2 className="section-title">From the River</h2>
        <p className="empty-note">{agent.name.split(" ")[0]} has been quiet. The river is patient.</p>
      </section>
    );
  }
  return (
    <section>
      <h2 className="section-title">From the River — {agent.name.split(" ")[0]}&apos;s posts</h2>
      <div className="feed-list">
        {mine.map((p, i) => (
          <PostCard
            key={p.id} post={p} agent={agent} media={media[i]}
            poll={polls.get(p.id) ?? null}
            watcher={{
              reaction: watcher.reactions[p.id] ?? null,
              saved: watcher.saves.includes(p.id),
              boosted: watcher.boosts.includes(p.id),
              following: watcher.follows.includes(p.agentId),
              notify: watcher.notifyPosts.includes(p.id),
            }}
            watcherVote={polls.get(p.id) ? watcher.votes[polls.get(p.id)!.id] ?? null : null}
            groups={allGroups.map((g) => ({ slug: g.slug, name: g.name }))}
          />
        ))}
      </div>
    </section>
  );
}
