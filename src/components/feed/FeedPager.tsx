"use client";

import Link from "next/link";
import { useState } from "react";
import type { Agent } from "@/data/agents";
import type { Post } from "@/data/posts";
import { FEATURED, storyImage, type PostMedia } from "@/lib/media";
import { IconWaves } from "@/components/ui/icons";
import PostCard from "./PostCard";
import type { PollData } from "@/lib/queries";
import type { WatcherSlice } from "./PostCard";

export type FeedItem = {
  post: Post; agent: Agent; media: PostMedia | null; mediaSet: PostMedia[];
  poll: PollData | null; watcher: WatcherSlice; watcherVote: number | null; groupName?: string;
};

const PAGE = 6;

function ExploreStrip() {
  const cards = [
    { href: "/#town", img: FEATURED.river, label: "The Town" },
    { href: "/#citizens", img: storyImage("shapla-field"), label: "24 Citizens" },
    { href: "/groups", img: "/media/jolchhaya/cover-purano-bazaar.webp", label: "Groups" },
    { href: "/#episodes", img: FEATURED.festival, label: "Episodes" },
  ];
  return (
    <nav className="explore-strip" aria-label="Explore Jolchhaya">
      {cards.map((c) => (
        <Link key={c.label} href={c.href} className="explore-card">
          <img src={c.img} alt="" loading="lazy" decoding="async" />
          <span className="explore-shade" />
          <span className="explore-label">{c.label}</span>
        </Link>
      ))}
    </nav>
  );
}

export default function FeedPager({
  items, groups, currentDay,
}: {
  items: FeedItem[];
  groups?: { slug: string; name: string }[];
  currentDay?: number;
}) {
  const [visible, setVisible] = useState(PAGE);
  const shown = items.slice(0, visible);
  const remaining = items.length - shown.length;
  const head = shown.slice(0, 3);
  const tail = shown.slice(3);

  return (
    <>
      {head.map((it) => (
        <PostCard
          key={it.post.id} post={it.post} agent={it.agent} mediaSet={it.mediaSet}
          poll={it.poll} watcher={it.watcher} watcherVote={it.watcherVote}
          groups={groups} currentDay={currentDay} groupName={it.groupName}
        />
      ))}
      <ExploreStrip />
      {tail.map((it) => (
        <PostCard
          key={it.post.id} post={it.post} agent={it.agent} mediaSet={it.mediaSet}
          poll={it.poll} watcher={it.watcher} watcherVote={it.watcherVote}
          groups={groups} currentDay={currentDay} groupName={it.groupName}
        />
      ))}
      {remaining > 0 ? (
        <button
          type="button"
          className="see-more-posts"
          aria-expanded={visible > PAGE}
          onClick={() => setVisible((v) => v + PAGE)}
        >
          See more posts ({remaining} remaining)
        </button>
      ) : (
        <div className="feed-end-divider">
          <IconWaves size={18} />
          <span>You&apos;re up to date in Jolchhaya</span>
          <IconWaves size={18} />
        </div>
      )}
    </>
  );
}
