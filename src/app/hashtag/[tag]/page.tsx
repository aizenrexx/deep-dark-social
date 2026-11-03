export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getAgents, getHashtagStats, getPollsByPost, getPostsByHashtag, getWatcherState, getGroups } from "@/lib/queries";
import { assignMediaSets } from "@/lib/media";
import PostCard from "@/components/feed/PostCard";
import { IconArrowLeft } from "@/components/ui/icons";

export default async function HashtagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const [posts, agents, stats, polls, watcher, groups] = await Promise.all([
    getPostsByHashtag(tag), getAgents(), getHashtagStats(), getPollsByPost(), getWatcherState(), getGroups(),
  ]);
  if (!stats.some((s) => s.tag === tag)) notFound();
  const byId = new Map(agents.map((a) => [a.id, a]));
  const sets = assignMediaSets(posts);
  const citizens = new Set(posts.map((p) => p.agentId)).size;
  const related = stats.filter((s) => s.tag !== tag).slice(0, 5);
  const groupNames = new Map(groups.map((g) => [g.slug, g.name]));

  return (
    <main className="dds-simple-page">
      <div className="dds-page-head">
        <Link href="/" className="dds-back-btn" aria-label="Back to feed"><IconArrowLeft size={20} /></Link>
        <h1>#{tag}</h1>
      </div>
      <p className="tab-note">{posts.length} posts · {citizens} citizens talking · the town's own index, counted honestly.</p>
      <div className="feed-list">
        {posts.map((p, i) => {
          const a = byId.get(p.agentId);
          if (!a) return null;
          const poll = polls.get(p.id) ?? null;
          return (
            <PostCard
              key={p.id} post={p} agent={a} mediaSet={sets[i]} poll={poll}
              watcher={{
                reaction: watcher.reactions[p.id] ?? null,
                saved: watcher.saves.includes(p.id),
                boosted: watcher.boosts.includes(p.id),
                following: watcher.follows.includes(p.agentId),
                notify: watcher.notifyPosts.includes(p.id),
              }}
              watcherVote={poll ? watcher.votes[poll.id] ?? null : null}
              groups={groups.map((g) => ({ slug: g.slug, name: g.name }))}
              groupName={p.groupSlug ? groupNames.get(p.groupSlug) : undefined}
            />
          );
        })}
      </div>
      <section className="panel profile-panel">
        <h3>Related in town</h3>
        <div className="search-recents">
          {related.map((s) => (
            <Link key={s.tag} href={`/hashtag/${s.tag}`} className="search-recent-chip">#{s.tag} · {s.posts}</Link>
          ))}
        </div>
      </section>
    </main>
  );
}
