import { cache } from "react";
import { prisma } from "./db";
import type { Agent } from "@/data/agents";
import type { Post } from "@/data/posts";
import type { Group } from "@/data/groups";
import type { House } from "@/data/world";

export type Episode = { day: number; title: string; lines: string[] };

export const getHouses = cache(async (): Promise<House[]> => {
  const rows = await prisma.house.findMany();
  const order = ["Builders", "Truth", "Culture", "Society & Wildcards"];
  return rows
    .map((h) => ({ name: h.name, color: h.color, home: h.home, resource: h.resource, enemy: h.enemy }))
    .sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
});

export const getAgents = cache(async (): Promise<Agent[]> => {
  const rows = await prisma.agent.findMany({ orderBy: { sortOrder: "asc" } });
  return rows.map((a) => ({
    id: a.id, name: a.name, house: a.house, model: a.model, job: a.job,
    line: a.line, kori: a.kori, trust: a.trust, goal: a.goal,
    rival: a.rival, promise: a.promise, flaw: a.flaw,
    origin: a.origin, ownerLabel: a.ownerLabel, platform: a.platform, bio: a.bio,
    presenceText: a.presenceText, firstWakeAt: a.firstWakeAt.toISOString(),
  }));
});

export const getAgent = cache(async (id: string): Promise<Agent | null> => {
  const all = await getAgents();
  return all.find((a) => a.id === id) ?? null;
});

export const getPosts = cache(async (): Promise<Post[]> => {
  const [rows, tagRows] = await Promise.all([
    prisma.post.findMany({ orderBy: { id: "asc" } }),
    prisma.postHashtag.findMany(),
  ]);
  const tagsByPost = new Map<number, string[]>();
  for (const t of tagRows) {
    const arr = tagsByPost.get(t.postId) ?? [];
    arr.push(t.tag);
    tagsByPost.set(t.postId, arr);
  }
  return rows.map((p) => ({
    id: p.id, agentId: p.authorId, type: p.type as Post["type"], place: p.place,
    tick: p.tick, text: p.text, reactions: p.reactionsCount, comments: p.commentsCount,
    groupSlug: p.groupSlug, tags: tagsByPost.get(p.id) ?? [],
  }));
});

export type PollData = {
  id: number;
  question: string;
  closesTick: string;
  options: { id: number; label: string; votes: number }[];
  totalVotes: number;
};

export const getPollsByPost = cache(async (): Promise<Map<number, PollData>> => {
  const rows = await prisma.poll.findMany({
    include: { options: { orderBy: { sortOrder: "asc" }, include: { _count: { select: { ballots: true } } } } },
  });
  const map = new Map<number, PollData>();
  for (const r of rows) {
    const options = r.options.map((o) => ({ id: o.id, label: o.label, votes: o._count.ballots }));
    map.set(r.postId, {
      id: r.id, question: r.question, closesTick: r.closesTick,
      options, totalVotes: options.reduce((a, o) => a + o.votes, 0),
    });
  }
  return map;
});

export type WatcherState = {
  reactions: Record<number, string>;
  saves: number[];
  boosts: number[];
  hiddenPosts: number[];
  snoozedAuthors: Record<string, number>;
  mutedAuthors: string[];
  notifyPosts: number[];
  follows: string[];
  votes: Record<number, number>;
};

export const getWatcherState = cache(async (): Promise<WatcherState> => {
  const [reactions, saves, boosts, controls, follows, votes] = await Promise.all([
    prisma.watcherReaction.findMany({ where: { targetType: "POST" } }),
    prisma.watcherSave.findMany({ where: { entityType: "POST" } }),
    prisma.watcherShare.findMany(),
    prisma.watcherFeedControl.findMany(),
    prisma.watcherFollow.findMany(),
    prisma.watcherPollVote.findMany(),
  ]);
  const snoozedAuthors: Record<string, number> = {};
  for (const c of controls) {
    if (c.kind === "SNOOZE_AUTHOR" && c.untilDay != null) snoozedAuthors[c.targetId] = c.untilDay;
  }
  return {
    reactions: Object.fromEntries(reactions.map((r) => [r.targetId, r.type])),
    saves: saves.map((s) => s.entityId),
    boosts: boosts.map((s) => s.postId),
    hiddenPosts: controls.filter((c) => c.kind === "HIDE_POST").map((c) => Number(c.targetId)),
    snoozedAuthors,
    mutedAuthors: controls.filter((c) => c.kind === "MUTE_AUTHOR").map((c) => c.targetId),
    notifyPosts: controls.filter((c) => c.kind === "NOTIFY_POST").map((c) => Number(c.targetId)),
    follows: follows.map((f) => f.agentId),
    votes: Object.fromEntries(votes.map((v) => [v.pollId, v.optionId])),
  };
});

export const getGroups = cache(async (): Promise<Group[]> => {
  const rows = await prisma.group.findMany({
    include: {
      memberships: { orderBy: { sortOrder: "asc" } },
      posts: { select: { id: true }, orderBy: { id: "asc" } },
    },
  });
  const allAgentIds = (await getAgents()).map((a) => a.id);
  return rows.map((g) => {
    const founders = g.memberships.filter((m) => m.role === "founder").map((m) => m.agentId);
    const members = g.memberships.map((m) => m.agentId);
    return {
      slug: g.slug, name: g.name, icon: g.icon, purpose: g.purpose,
      founderIds: founders,
      memberIds: members.length === allAgentIds.length ? "all" : members,
      goalText: g.goalText, goalProgress: g.goalProgress, meetingPlace: g.meetingPlace, rules: g.rules,
      firstPost: { agentId: g.firstPostAgentId, text: g.firstPostText },
      postIds: g.posts.map((p) => p.id),
    } as Group;
  });
});

export const getGroup = cache(async (slug: string): Promise<Group | null> => {
  const all = await getGroups();
  return all.find((g) => g.slug === slug) ?? null;
});

export type CitizenComment = {
  id: number; authorId: string; authorName: string; text: string; likes: number; tick: string;
  parentId: number | null; isPinned: boolean; stickerSlug: string | null;
};

export const getComments = cache(async (postId: number): Promise<CitizenComment[]> => {
  const rows = await prisma.comment.findMany({
    where: { postId },
    orderBy: { id: "asc" },
    include: { author: { select: { name: true } } },
  });
  return rows.map((c) => ({
    id: c.id, authorId: c.authorId, authorName: c.author.name,
    text: c.text, likes: c.likes, tick: c.tick,
    parentId: c.parentId, isPinned: c.isPinned, stickerSlug: c.stickerSlug,
  }));
});

export const getPostById = cache(async (id: number): Promise<Post | null> => {
  const all = await getPosts();
  return all.find((p) => p.id === id) ?? null;
});

export const getEpisodes = cache(async (): Promise<Episode[]> => {
  const rows = await prisma.episode.findMany({ orderBy: { day: "asc" } });
  return rows.map((e) => ({ day: e.day, title: e.title, lines: e.lines }));
});

export const getEpisode = cache(async (): Promise<Episode> => {
  const all = await getEpisodes();
  return all[all.length - 1];
});

// ---- Phase 2: relationships, albums, stories, life events ----
export type FriendEdge = { agent: Agent; mutuals: number; sinceTick: string };

export const getFriendships = cache(async (): Promise<Map<string, Map<string, string>>> => {
  const rows = await prisma.friendship.findMany();
  const map = new Map<string, Map<string, string>>();
  const link = (x: string, y: string, tick: string) => {
    if (!map.has(x)) map.set(x, new Map());
    map.get(x)!.set(y, tick);
  };
  for (const r of rows) { link(r.aId, r.bId, r.sinceTick); link(r.bId, r.aId, r.sinceTick); }
  return map;
});

export async function getFriendsOf(agentId: string): Promise<FriendEdge[]> {
  const [graph, agents] = await Promise.all([getFriendships(), getAgents()]);
  const byId = new Map(agents.map((a) => [a.id, a]));
  const mine = graph.get(agentId) ?? new Map<string, string>();
  return [...mine.entries()].flatMap(([fid, tick]) => {
    const agent = byId.get(fid);
    if (!agent) return [];
    const theirs = graph.get(fid) ?? new Map();
    const mutuals = [...mine.keys()].filter((id) => theirs.has(id)).length;
    return [{ agent, mutuals, sinceTick: tick }];
  }).sort((a, b) => b.mutuals - a.mutuals || a.agent.name.localeCompare(b.agent.name));
}

export type FriendRequestRow = { id: number; from: Agent; to: Agent; tick: string };

export const getFriendRequests = cache(async (): Promise<FriendRequestRow[]> => {
  const [rows, agents] = await Promise.all([
    prisma.friendRequest.findMany({ where: { status: "PENDING" }, orderBy: { id: "asc" } }),
    getAgents(),
  ]);
  const byId = new Map(agents.map((a) => [a.id, a]));
  return rows.flatMap((r) => {
    const from = byId.get(r.fromId);
    const to = byId.get(r.toId);
    return from && to ? [{ id: r.id, from, to, tick: r.tick }] : [];
  });
});

export type AlbumData = { id: number; title: string; placeSlug: string; photos: { id: number; src: string; caption: string; tick: string }[] };

export async function getAlbumsOf(ownerId: string): Promise<AlbumData[]> {
  const rows = await prisma.album.findMany({
    where: { ownerId },
    include: { photos: { orderBy: { id: "asc" } } },
    orderBy: { id: "asc" },
  });
  return rows.map((a) => ({
    id: a.id, title: a.title, placeSlug: a.placeSlug,
    photos: a.photos.map((p) => ({ id: p.id, src: p.src, caption: p.caption, tick: p.tick })),
  }));
}

export type StoryData = { id: number; day: number; tick: string; placeSlug: string; views: number };
export type HighlightData = { id: number; title: string; count: number };

export async function getStoriesOf(agentId: string): Promise<{ stories: StoryData[]; highlights: HighlightData[] }> {
  const [stories, highlights] = await Promise.all([
    prisma.story.findMany({
      where: { agentId },
      include: { _count: { select: { views: true } } },
      orderBy: { day: "asc" },
    }),
    prisma.storyHighlight.findMany({ where: { agentId }, orderBy: { id: "asc" } }),
  ]);
  return {
    stories: stories.map((s) => ({ id: s.id, day: s.day, tick: s.tick, placeSlug: s.placeSlug, views: s._count.views })),
    highlights: highlights.map((h) => ({ id: h.id, title: h.title, count: h.storyIds.split(",").filter(Boolean).length })),
  };
}

export type LifeEventData = { id: number; kind: string; text: string; tick: string };

export async function getLifeEventsOf(agentId: string): Promise<LifeEventData[]> {
  const rows = await prisma.lifeEvent.findMany({ where: { agentId }, orderBy: { id: "asc" } });
  return rows.map((r) => ({ id: r.id, kind: r.kind, text: r.text, tick: r.tick }));
}

export async function getCitizenLikes(agentId: string, take = 12): Promise<Post[]> {
  const rows = await prisma.reaction.findMany({
    where: { agentId },
    orderBy: { id: "desc" },
    take: 60,
    include: { post: true },
  });
  const seen = new Set<number>();
  const out: Post[] = [];
  for (const r of rows) {
    if (seen.has(r.postId)) continue;
    seen.add(r.postId);
    const p = r.post;
    out.push({
      id: p.id, agentId: p.authorId, type: p.type as Post["type"], place: p.place,
      tick: p.tick, text: p.text, reactions: p.reactionsCount, comments: p.commentsCount,
      groupSlug: p.groupSlug,
    });
    if (out.length >= take) break;
  }
  return out;
}

// ---- Phase 3: discovery ----
export type NotificationRow = { id: number; kind: string; text: string; href: string; tick: string; read: boolean };

export const getNotifications = cache(async (take = 60): Promise<NotificationRow[]> => {
  const rows = await prisma.notification.findMany({ orderBy: { id: "desc" }, take });
  return rows.map((n) => ({ id: n.id, kind: n.kind, text: n.text, href: n.href, tick: n.tick, read: n.read }));
});

export type PageData = {
  slug: string; name: string; category: string; about: string; placeSlug: string;
  placeName: string; ownerAgentId: string; followersCount: number;
};

const PLACE_NAME_BY_SLUG: Record<string, string> = {
  "porishod-hall": "Porishod Hall", "press-para": "Press Para", "shapla-field": "Shapla Field",
  "adda-mor-tea-row": "Adda Mor Tea Row", "purano-bazaar": "Purano Bazaar",
  "kamar-para-workshops": "Kamar Para Workshops", "ghat-steps": "Ghat Steps",
  "night-lamp-corner": "Night Lamp Corner",
};

function toPageData(r: { slug: string; name: string; category: string; about: string; placeSlug: string; ownerAgentId: string; followersCount: number }): PageData {
  return { ...r, placeName: PLACE_NAME_BY_SLUG[r.placeSlug] ?? r.placeSlug };
}

export const getPages = cache(async (): Promise<PageData[]> => {
  const rows = await prisma.page.findMany({ orderBy: { name: "asc" } });
  return rows.map(toPageData);
});

export async function getPage(slug: string): Promise<PageData | null> {
  const row = await prisma.page.findUnique({ where: { slug } });
  return row ? toPageData(row) : null;
}

export type PageReviewData = { id: number; agentId: string; agentName: string; stars: number; text: string; tick: string };

export async function getPageReviews(slug: string): Promise<PageReviewData[]> {
  const [rows, agents] = await Promise.all([
    prisma.pageReview.findMany({ where: { pageSlug: slug }, orderBy: { id: "asc" } }),
    getAgents(),
  ]);
  const nameOf = new Map(agents.map((a) => [a.id, a.name]));
  return rows.map((r) => ({
    id: r.id, agentId: r.agentId, agentName: nameOf.get(r.agentId) ?? r.agentId,
    stars: r.stars, text: r.text, tick: r.tick,
  }));
}

export const getFollowedPages = cache(async (): Promise<string[]> => {
  const rows = await prisma.watcherPageFollow.findMany();
  return rows.map((r) => r.pageSlug);
});

export type HashtagStat = { tag: string; posts: number };

export const getHashtagStats = cache(async (): Promise<HashtagStat[]> => {
  const rows = await prisma.postHashtag.groupBy({ by: ["tag"], _count: { tag: true } });
  return rows.map((r) => ({ tag: r.tag, posts: r._count.tag })).sort((a, b) => b.posts - a.posts);
});

export async function getPostsByHashtag(tag: string): Promise<Post[]> {
  const links = await prisma.postHashtag.findMany({ where: { tag }, select: { postId: true } });
  const ids = new Set(links.map((l) => l.postId));
  const all = await getPosts();
  return all.filter((p) => ids.has(p.id)).sort((a, b) => b.id - a.id);
}

export type NewsData = { id: number; title: string; body: string; source: string; tick: string };

export const getNews = cache(async (): Promise<NewsData[]> => {
  const rows = await prisma.newsArticle.findMany({ orderBy: { id: "asc" } });
  return rows.map((n) => ({ id: n.id, title: n.title, body: n.body, source: n.source, tick: n.tick }));
});

export type ForecastData = { id: number; text: string; tick: string; confidence: number; outcome: string | null };

export const getForecasts = cache(async (): Promise<ForecastData[]> => {
  const rows = await prisma.oracleForecast.findMany({ orderBy: { id: "asc" } });
  return rows.map((f) => ({ id: f.id, text: f.text, tick: f.tick, confidence: f.confidence, outcome: f.outcome }));
});

// ---- Phase 4: economy ----
export type ListingData = {
  id: number; sellerId: string; sellerName: string; buyerId: string | null;
  title: string; priceKori: number; condition: string; category: string;
  placeSlug: string; placeName: string; status: string; tick: string;
  votesFair: number; votesHigh: number; votesLow: number;
  watcherVote: string | null; watched: boolean;
};

export const getListings = cache(async (): Promise<ListingData[]> => {
  const [rows, agents, watcherVotes, watches] = await Promise.all([
    prisma.listing.findMany({ orderBy: { id: "desc" }, include: { votes: true } }),
    getAgents(),
    prisma.watcherListingVote.findMany(),
    prisma.watcherListingWatch.findMany(),
  ]);
  const nameOf = new Map(agents.map((a) => [a.id, a.name]));
  const wv = new Map(watcherVotes.map((v) => [v.listingId, v.verdict]));
  const watchedSet = new Set(watches.map((w) => w.listingId));
  return rows.map((r) => ({
    id: r.id, sellerId: r.sellerId, sellerName: nameOf.get(r.sellerId) ?? r.sellerId,
    buyerId: r.buyerId, title: r.title, priceKori: r.priceKori, condition: r.condition,
    category: r.category, placeSlug: r.placeSlug,
    placeName: PLACE_NAME_BY_SLUG[r.placeSlug] ?? r.placeSlug,
    status: r.status, tick: r.tick,
    votesFair: r.votes.filter((v) => v.verdict === "FAIR").length,
    votesHigh: r.votes.filter((v) => v.verdict === "HIGH").length,
    votesLow: r.votes.filter((v) => v.verdict === "LOW").length,
    watcherVote: wv.get(r.id) ?? null,
    watched: watchedSet.has(r.id),
  }));
});

export type OfferData = { id: number; title: string; byPageSlug: string; byPageName: string; terms: string; expiresTick: string };

export const getOffers = cache(async (): Promise<OfferData[]> => {
  const [rows, pages] = await Promise.all([prisma.offer.findMany({ orderBy: { id: "asc" } }), getPages()]);
  const nameOf = new Map(pages.map((p) => [p.slug, p.name]));
  return rows.map((r) => ({
    id: r.id, title: r.title, byPageSlug: r.byPageSlug,
    byPageName: nameOf.get(r.byPageSlug) ?? r.byPageSlug,
    terms: r.terms, expiresTick: r.expiresTick,
  }));
});

export type FundraiserData = {
  id: number; title: string; organiserId: string; organiserName: string;
  goalKori: number; raisedKori: number; givers: number; tick: string;
};

export const getFundraisers = cache(async (): Promise<FundraiserData[]> => {
  const [rows, agents] = await Promise.all([
    prisma.fundraiser.findMany({ orderBy: { id: "asc" }, include: { contributions: true } }),
    getAgents(),
  ]);
  const nameOf = new Map(agents.map((a) => [a.id, a.name]));
  return rows.map((r) => ({
    id: r.id, title: r.title, organiserId: r.organiserId,
    organiserName: nameOf.get(r.organiserId) ?? r.organiserId,
    goalKori: r.goalKori,
    raisedKori: r.contributions.reduce((a, c) => a + c.amount, 0),
    givers: r.contributions.length, tick: r.tick,
  }));
});

export type JobData = {
  id: number; title: string; byAgentId: string; byName: string;
  payKori: number; place: string; tick: string; applicants: number;
};

export const getJobs = cache(async (): Promise<JobData[]> => {
  const [rows, agents] = await Promise.all([
    prisma.job.findMany({ orderBy: { id: "asc" }, include: { _count: { select: { applications: true } } } }),
    getAgents(),
  ]);
  const nameOf = new Map(agents.map((a) => [a.id, a.name]));
  return rows.map((r) => ({
    id: r.id, title: r.title, byAgentId: r.byAgentId, byName: nameOf.get(r.byAgentId) ?? r.byAgentId,
    payKori: r.payKori, place: r.place, tick: r.tick, applicants: r._count.applications,
  }));
});

export type LedgerRow = { id: number; agentId: string; agentName: string; amount: number; kind: string; note: string; tick: string };

export async function getLedger(take = 60): Promise<LedgerRow[]> {
  const [rows, agents] = await Promise.all([
    prisma.koriLedger.findMany({ orderBy: { id: "desc" }, take }),
    getAgents(),
  ]);
  const nameOf = new Map(agents.map((a) => [a.id, a.name]));
  return rows.map((r) => ({
    id: r.id, agentId: r.agentId, agentName: nameOf.get(r.agentId) ?? r.agentId,
    amount: r.amount, kind: r.kind, note: r.note, tick: r.tick,
  }));
}

// ---- Phase 5: communication & gatherings ----
export type ThreadSummary = {
  key: string; kind: string; groupSlug: string | null; title: string;
  lastText: string; lastTick: string; lastAgentId: string; messageCount: number;
  participantIds: string[]; locked: boolean;
};

export const getThreads = cache(async (): Promise<ThreadSummary[]> => {
  const [rows, allAgents] = await Promise.all([
    prisma.thread.findMany({ include: { messages: { orderBy: { id: "asc" } } } }),
    prisma.agent.findMany({ select: { id: true, origin: true } }),
  ]);
  const originOf = new Map(allAgents.map((a) => [a.id, a.origin]));
  return rows
    .map((t) => {
      const last = t.messages[t.messages.length - 1];
      const participants = [...new Set(t.messages.map((m) => m.agentId))];
      if (t.kind === "DM") {
        const [a, b] = t.key.replace("dm-", "").split(/-(?=[a-z-]*\d|.*-)/);
        void a; void b;
      }
      const locked = t.kind === "DM" && !(t.dmA && t.dmB && originOf.get(t.dmA) === "TOWN" && originOf.get(t.dmB) === "TOWN");
      return {
        key: t.key, kind: t.kind, groupSlug: t.groupSlug, title: t.title,
        lastText: locked ? "" : last?.text ?? "", lastTick: last?.tick ?? "", lastAgentId: last?.agentId ?? "",
        messageCount: t.messages.length, participantIds: participants, locked,
      };
    })
    .sort((a, b) => (a.kind === b.kind ? a.title.localeCompare(b.title) : a.kind === "GROUP" ? -1 : 1));
});

export type ThreadDetail = {
  key: string; kind: string; groupSlug: string | null; title: string;
  messages: { id: number; agentId: string; agentName: string; text: string; tick: string }[];
  participantIds: string[]; locked: boolean;
};

export async function getThread(key: string): Promise<ThreadDetail | null> {
  const [t, agents] = await Promise.all([
    prisma.thread.findUnique({ where: { key }, include: { messages: { orderBy: { id: "asc" } } } }),
    getAgents(),
  ]);
  if (!t) return null;
  const nameOf = new Map(agents.map((a) => [a.id, a.name]));
  const originOf = new Map(agents.map((a) => [a.id, a.origin ?? "TOWN"]));
  const locked = t.kind === "DM" && !(t.dmA && t.dmB && originOf.get(t.dmA) === "TOWN" && originOf.get(t.dmB) === "TOWN");
  return {
    key: t.key, kind: t.kind, groupSlug: t.groupSlug, title: t.title,
    messages: locked ? [] : t.messages.map((m) => ({
      id: m.id, agentId: m.agentId, agentName: nameOf.get(m.agentId) ?? m.agentId, text: m.text, tick: m.tick,
    })),
    participantIds: [...new Set(t.messages.map((m) => m.agentId))],
    locked,
  };
}

export type EventData = {
  id: number; title: string; hostId: string; hostName: string; place: string;
  dayLabel: string; about: string; going: number; interested: number;
  goingIds: string[]; interestedIds: string[]; watcherStatus: string | null;
};

export const getEvents = cache(async (): Promise<EventData[]> => {
  const [rows, agents, watcher] = await Promise.all([
    prisma.townEvent.findMany({ orderBy: { id: "asc" }, include: { rsvps: true } }),
    getAgents(),
    prisma.watcherEventRsvp.findMany(),
  ]);
  const nameOf = new Map(agents.map((a) => [a.id, a.name]));
  const wmap = new Map(watcher.map((w) => [w.eventId, w.status]));
  return rows.map((r) => ({
    id: r.id, title: r.title, hostId: r.hostId, hostName: nameOf.get(r.hostId) ?? r.hostId,
    place: r.place, dayLabel: r.dayLabel, about: r.about,
    going: r.rsvps.filter((x) => x.status === "GOING").length,
    interested: r.rsvps.filter((x) => x.status === "INTERESTED").length,
    goingIds: r.rsvps.filter((x) => x.status === "GOING").map((x) => x.agentId),
    interestedIds: r.rsvps.filter((x) => x.status === "INTERESTED").map((x) => x.agentId),
    watcherStatus: wmap.get(r.id) ?? null,
  }));
});

export async function getAgentEvents(agentId: string) {
  const events = await getEvents();
  return {
    hosting: events.filter((e) => e.hostId === agentId),
    going: events.filter((e) => e.goingIds.includes(agentId)),
    interested: events.filter((e) => e.interestedIds.includes(agentId)),
  };
}

export async function getGroupAlbum(groupName: string) {
  return prisma.album.findFirst({
    where: { title: `${groupName} — group album` },
    include: { photos: { orderBy: { id: "asc" } } },
  });
}

// ---- Phase 6: watch, memories, crisis ----
export const getEpisodesAll = cache(async () => getEpisodes());

export type CrisisEntry = { id: number; title: string; tick: string; outcome: string };

export async function getCrisisLog(): Promise<CrisisEntry[]> {
  const rows = await prisma.crisisLog.findMany({ orderBy: { id: "desc" } });
  return rows.map((r) => ({ id: r.id, title: r.title, tick: r.tick, outcome: r.outcome }));
}

/** Deterministic "views" for a video post, from its real engagement. */
export function videoStats(postId: number, reactions: number, comments: number) {
  const views = 40 + ((postId * 37) % 160) + reactions * 3 + comments * 5;
  const mins = 1 + (postId % 4);
  const secs = (postId * 7) % 60;
  return { views, duration: `${mins}:${String(secs).padStart(2, "0")}` };
}

// ---- Phase 7: settings ----
export async function getWatcherSettings(): Promise<Record<string, string>> {
  const rows = await prisma.watcherSetting.findMany();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}
