export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getAgent, getComments, getEpisode, getGroups, getPollsByPost, getPostById, getWatcherState } from "@/lib/queries";
import { assignMediaSets } from "@/lib/media";
import PostCard from "@/components/feed/PostCard";
import { IconArrowLeft } from "@/components/ui/icons";

// Post permalink (master plan Phase 1): the post with its full citizen
// thread, reaction picker, share sheet and poll — all live.
export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const postId = Number(id);
  if (!Number.isFinite(postId)) notFound();
  const post = await getPostById(postId);
  if (!post) notFound();
  const agent = await getAgent(post.agentId);
  if (!agent) notFound();
  const [comments, polls, watcher, groups, episode] = await Promise.all([
    getComments(postId), getPollsByPost(), getWatcherState(), getGroups(), getEpisode(),
  ]);
  const mediaSet = assignMediaSets([post])[0];
  const poll = polls.get(postId) ?? null;

  return (
    <main className="dds-simple-page">
      <div className="dds-page-head">
        <Link href="/" className="dds-back-btn" aria-label="Back to feed"><IconArrowLeft size={20} /></Link>
        <h1>Post</h1>
      </div>
      <PostCard
        post={post}
        agent={agent}
        mediaSet={mediaSet}
        poll={poll}
        watcher={{
          reaction: watcher.reactions[postId] ?? null,
          saved: watcher.saves.includes(postId),
          boosted: watcher.boosts.includes(postId),
          following: watcher.follows.includes(post.agentId),
          notify: watcher.notifyPosts.includes(postId),
        }}
        watcherVote={poll ? watcher.votes[poll.id] ?? null : null}
        comments={comments}
        groups={groups.map((g) => ({ slug: g.slug, name: g.name }))}
        currentDay={episode.day}
        groupName={post.groupSlug ? groups.find((g) => g.slug === post.groupSlug)?.name : undefined}
        threadDefaultOpen
      />
    </main>
  );
}
