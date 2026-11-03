import { getAgents, getGroups, getPollsByPost, getPosts, getWatcherState } from "@/lib/queries";
import PostCard from "@/components/feed/PostCard";
import { assignMedia } from "@/lib/media";
import { IconPin } from "@/components/ui/icons";
import type { Group } from "@/data/groups";

export default async function GroupFeed({ group }: { group: Group }) {
  const agents = await getAgents();
  const posts = await getPosts();
  const polls = await getPollsByPost();
  const watcher = await getWatcherState();
  const allGroups = await getGroups();
  const sliceFor = (p: { id: number; agentId: string }) => ({
    reaction: watcher.reactions[p.id] ?? null,
    saved: watcher.saves.includes(p.id),
    boosted: watcher.boosts.includes(p.id),
    following: watcher.follows.includes(p.agentId),
    notify: watcher.notifyPosts.includes(p.id),
  });
  const founder = agents.find((a) => a.id === group.firstPost.agentId);
  const related = posts.filter((p) => group.postIds.includes(p.id)).sort((a, b) => b.id - a.id);
  const media = assignMedia(related);
  return (
    <section>
      <h2 className="section-title">Group Feed</h2>
      {founder && (
        <div className="pinned-wrap">
          <span className="pin-chip"><IconPin size={13} /> First post</span>
          <PostCard
            post={{ id: -1, agentId: founder.id, type: "Notice", place: group.meetingPlace, tick: "Day 2 · 22:30", text: group.firstPost.text, reactions: 0, comments: 0 }}
            agent={founder}
          />
        </div>
      )}
      <div className="feed-list">
        {related.map((p, i) => {
          const a = agents.find((x) => x.id === p.agentId);
          return a ? (
            <PostCard
              key={p.id} post={p} agent={a} media={media[i]}
              poll={polls.get(p.id) ?? null} watcher={sliceFor(p)}
              watcherVote={polls.get(p.id) ? watcher.votes[polls.get(p.id)!.id] ?? null : null}
              groups={allGroups.map((g) => ({ slug: g.slug, name: g.name }))}
              groupName={group.name}
            />
          ) : null;
        })}
      </div>
      {related.length === 0 && <p className="empty-note">Quiet in here. Even groups listen sometimes.</p>}
    </section>
  );
}
