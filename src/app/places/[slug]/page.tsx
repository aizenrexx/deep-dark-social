export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getAgents, getPollsByPost, getPosts, getWatcherState } from "@/lib/queries";
import { PLACE_SLUG, assignMediaSets, coverImage } from "@/lib/media";
import Avatar from "@/components/ui/Avatar";
import PostCard from "@/components/feed/PostCard";
import { IconArrowLeft } from "@/components/ui/icons";

export default async function PlaceDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const name = Object.entries(PLACE_SLUG).find(([, s]) => s === slug)?.[0];
  if (!name) notFound();
  const [agents, posts, polls, watcher] = await Promise.all([getAgents(), getPosts(), getPollsByPost(), getWatcherState()]);
  const byId = new Map(agents.map((a) => [a.id, a]));
  const placePosts = posts.filter((p) => p.place === name).sort((a, b) => b.id - a.id);
  const sets = assignMediaSets(placePosts);
  const voices = new Map<string, number>();
  for (const p of placePosts) voices.set(p.agentId, (voices.get(p.agentId) ?? 0) + 1);
  const topVoices = [...voices.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <main className="dds-simple-page wide">
      <div className="dds-page-head">
        <Link href="/places" className="dds-back-btn" aria-label="Back to places"><IconArrowLeft size={20} /></Link>
        <h1>{name}</h1>
      </div>
      <img className="place-hero" src={coverImage(slug)} alt={`${name} in Jolchhaya`} />
      <p className="tab-note">{placePosts.length} posts from this place · {voices.size} citizens have posted here.</p>
      <section className="panel profile-panel">
        <h3>Voices of {name}</h3>
        <div className="search-recents">
          {topVoices.map(([id, n]) => {
            const a = byId.get(id);
            return a ? (
              <Link key={id} href={`/agents/${id}`} className="voice-chip">
                <Avatar id={a.id} name={a.name} size={24} /> {a.name} · {n}
              </Link>
            ) : null;
          })}
        </div>
      </section>
      <div className="feed-list">
        {placePosts.map((p, i) => {
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
            />
          );
        })}
      </div>
    </main>
  );
}
