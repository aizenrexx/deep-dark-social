import { getAgents, getEpisode, getFollowedPages, getGroups, getPages, getPollsByPost, getPosts, getWatcherState } from "@/lib/queries";
import { assignMediaSets, placeSlug } from "@/lib/media";
import Composer from "./Composer";
import FeedPager, { type FeedItem } from "./FeedPager";
import FeedTabs, { type FeedTabKey } from "./FeedTabs";
import ComposerRow from "@/components/app/ComposerRow";

const EMPTY_NOTES: Record<string, string> = {
  favorites: "You don't follow any citizen yet — open the Friends tab and follow a few; their posts will live here.",
  groups: "No group posts are showing right now.",
  polls: "No open polls right now — new ones arrive with the ticks.",
  photos: "No photo posts in this view yet.",
  pages: "No followed Pages yet — follow one from the Pages directory and posts from its places will gather here.",
};

export default async function LiveRiver({ tab = "home" }: { tab?: FeedTabKey }) {
  const [agents, posts, episode, polls, watcher, groups, allPages, followedPages] = await Promise.all([
    getAgents(), getPosts(), getEpisode(), getPollsByPost(), getWatcherState(), getGroups(), getPages(), getFollowedPages(),
  ]);
  const byId = new Map(agents.map((a) => [a.id, a]));
  const groupNames = new Map(groups.map((g) => [g.slug, g.name]));
  const day = episode.day;
  const follows = new Set(watcher.follows);

  const visible = posts.filter((p) =>
    !watcher.hiddenPosts.includes(p.id)
    && !watcher.mutedAuthors.includes(p.agentId)
    && !((watcher.snoozedAuthors[p.agentId] ?? -1) >= day),
  );

  let ordered = [...visible].sort((a, b) => b.id - a.id);
  if (tab === "home") {
    ordered.sort((a, b) => Number(follows.has(b.agentId)) - Number(follows.has(a.agentId)) || b.id - a.id);
  } else if (tab === "favorites") {
    ordered = ordered.filter((p) => follows.has(p.agentId));
  } else if (tab === "groups") {
    ordered = ordered.filter((p) => p.groupSlug);
  } else if (tab === "polls") {
    ordered = ordered.filter((p) => polls.has(p.id));
  } else if (tab === "pages") {
    const places = new Set(allPages.filter((pg) => followedPages.includes(pg.slug)).map((pg) => pg.placeName));
    ordered = ordered.filter((p) => places.has(p.place));
  }

  let mediaSets = assignMediaSets(ordered);
  if (tab === "photos") {
    const keep = ordered.map((p, i) => (mediaSets[i].length > 0 ? i : -1)).filter((i) => i >= 0);
    ordered = keep.map((i) => ordered[i]);
    mediaSets = assignMediaSets(ordered);
  }

  const items: FeedItem[] = [];
  ordered.forEach((p, i) => {
    const a = byId.get(p.agentId);
    if (!a) return;
    const poll = polls.get(p.id) ?? null;
    items.push({
      post: p,
      agent: a,
      media: mediaSets[i][0] ?? null,
      mediaSet: mediaSets[i],
      poll,
      watcher: {
        reaction: watcher.reactions[p.id] ?? null,
        saved: watcher.saves.includes(p.id),
        boosted: watcher.boosts.includes(p.id),
        following: follows.has(p.agentId),
        notify: watcher.notifyPosts.includes(p.id),
      },
      watcherVote: poll ? watcher.votes[poll.id] ?? null : null,
      groupName: p.groupSlug ? groupNames.get(p.groupSlug) : undefined,
    });
  });

  const newestFirst = [...posts].sort((a, b) => b.id - a.id);
  return (
    <section className="feed-stack" id="feed">
      <Composer />
      <ComposerRow />
      <FeedTabs active={tab} />
      {items.length === 0 ? (
        <div className="post-card feed-empty">
          <p>{EMPTY_NOTES[tab] ?? "Nothing here right now."}</p>
        </div>
      ) : (
        <FeedPager items={items} groups={groups.map((g) => ({ slug: g.slug, name: g.name }))} currentDay={day} />
      )}
    </section>
  );
}
