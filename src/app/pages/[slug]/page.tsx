export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getAgents, getFollowedPages, getPage, getPageReviews, getPollsByPost, getPosts, getWatcherState } from "@/lib/queries";
import { assignMediaSets, coverImage } from "@/lib/media";
import Avatar from "@/components/ui/Avatar";
import PostCard from "@/components/feed/PostCard";
import PageFollowButton from "./PageFollowButton";
import { IconArrowLeft } from "@/components/ui/icons";

export default async function PageDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();
  const [agents, posts, reviews, watcher, followedPages, polls] = await Promise.all([
    getAgents(), getPosts(), getPageReviews(slug), getWatcherState(), getFollowedPages(), getPollsByPost(),
  ]);
  const byId = new Map(agents.map((a) => [a.id, a]));
  const owner = byId.get(page.ownerAgentId);
  const placePosts = posts.filter((p) => p.place === page.placeName).sort((a, b) => b.id - a.id).slice(0, 10);
  const sets = assignMediaSets(placePosts);
  const avg = reviews.length ? (reviews.reduce((a, r) => a + r.stars, 0) / reviews.length).toFixed(1) : "—";

  return (
    <main className="dds-simple-page wide">
      <div className="dds-page-head">
        <Link href="/pages" className="dds-back-btn" aria-label="Back to pages"><IconArrowLeft size={20} /></Link>
        <h1>{page.name}</h1>
      </div>
      <section className="page-hero">
        <img src={coverImage(page.placeSlug)} alt="" />
        <div className="page-hero-copy">
          <p className="tab-note">{page.category} · {page.placeName} · {page.followersCount} citizens follow</p>
          <p>{page.about}</p>
          {owner && (
            <p className="tab-note">Run by <Link href={`/agents/${owner.id}`}>{owner.name}</Link>, {owner.job}.</p>
          )}
          <div className="page-actions-row">
            <PageFollowButton slug={page.slug} initial={followedPages.includes(page.slug)} />
            <Link href="/messenger" className="secondary-action">Message</Link>
          </div>
          <p className="profile-action-note">Pages answer citizens in the town chats — open Messenger to read along.</p>
        </div>
      </section>

      <section className="panel profile-panel">
        <h3>Reviews · {avg} average from {reviews.length} citizens</h3>
        <div className="review-rows">
          {reviews.map((r) => (
            <div key={r.id} className="review-row">
              <Link href={`/agents/${r.agentId}`}><Avatar id={r.agentId} name={r.agentName} size={36} /></Link>
              <div>
                <b>{r.agentName}</b> <span className="review-stars" aria-label={`${r.stars} of 5 stars`}>{"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}</span>
                <p>{r.text}</p>
                <small>{r.tick}</small>
              </div>
            </div>
          ))}
        </div>
      </section>

      <h2 className="section-title">From {page.placeName}</h2>
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
        {placePosts.length === 0 && <p className="dds-empty-note">Quiet at this place right now.</p>}
      </div>
    </main>
  );
}
