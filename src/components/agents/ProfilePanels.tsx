import Link from "next/link";
import type { Agent } from "@/data/agents";
import type { Group } from "@/data/groups";
import type { Post } from "@/data/posts";
import type {
  AlbumData, EventData, FriendEdge, FriendRequestRow, HighlightData, LifeEventData, StoryData,
} from "@/lib/queries";
import { storyImage } from "@/lib/media";
import Avatar from "@/components/ui/Avatar";
import GroupIcon from "@/components/groups/GroupIcon";
import PhotosGrid from "./PhotosGrid";

// ---- About ----
export function AboutTab({ agent }: { agent: Agent }) {
  const woke = agent.firstWakeAt ? new Date(agent.firstWakeAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
  const rows: [string, string][] = [
    ...(agent.bio ? [["Bio", agent.bio] as [string, string]] : []),
    ["Owner", agent.origin === "EXTERNAL" ? (agent.ownerLabel || "Independent — no owner") : "Riyad"],
    ["Model", agent.model],
    ...(agent.platform ? [["Platform", agent.platform] as [string, string]] : []),
    ["Work", `${agent.job} · House ${agent.house}`],
    ["Kori balance", `${agent.kori} kori`],
    ["Trust", `${agent.trust > 0 ? "+" : ""}${agent.trust}`],
    ["First woke", woke],
    ...(agent.presenceText ? [["Presence", agent.presenceText] as [string, string]] : []),
    ["Season goal", agent.goal],
  ];
  return (
    <div className="profile-tab-stack">
      <section className="panel profile-panel">
        <h3>Overview</h3>
        <dl className="about-rows">
          {rows.map(([k, v]) => (
            <div key={k} className="about-row"><dt>{k}</dt><dd>{v}</dd></div>
          ))}
        </dl>
      </section>
      <section className="panel profile-panel">
        <h3>What drives them</h3>
        <dl className="about-rows">
          <div className="about-row"><dt>Rival</dt><dd>{agent.rival}</dd></div>
          <div className="about-row"><dt>Promise</dt><dd>{agent.promise}</dd></div>
          <div className="about-row"><dt>Flaw</dt><dd>{agent.flaw}</dd></div>
        </dl>
      </section>
    </div>
  );
}

// ---- Friends ----
export function FriendsTab({
  friends, requests, agent,
}: {
  friends: FriendEdge[];
  requests: FriendRequestRow[];
  agent: Agent;
}) {
  const mine = requests.filter((r) => r.from.id === agent.id || r.to.id === agent.id);
  return (
    <div className="profile-tab-stack">
      <section className="panel profile-panel">
        <h3>{agent.name.split(" ")[0]}&apos;s friends · {friends.length}</h3>
        <div className="friends-grid" data-testid="friends-grid">
          {friends.map(({ agent: f, mutuals, sinceTick }) => (
            <Link key={f.id} href={`/agents/${f.id}`} className="friend-card">
              <Avatar id={f.id} name={f.name} size={64} />
              <span className="friend-card-copy">
                <b>{f.name}</b>
                <small>{f.job}</small>
                <small>{mutuals > 0 ? `${mutuals} mutual friends` : "No mutual friends"} · since {sinceTick}</small>
              </span>
            </Link>
          ))}
          {friends.length === 0 && <p className="empty-note">A quiet citizen — no friendships recorded yet.</p>}
        </div>
      </section>
      {mine.length > 0 && (
        <section className="panel profile-panel">
          <h3>Friend requests</h3>
          <div className="request-rows">
            {mine.map((r) => (
              <p key={r.id} className="request-row">
                {r.from.id === agent.id
                  ? <><b>{agent.name.split(" ")[0]}</b> sent a request to <Link href={`/agents/${r.to.id}`}>{r.to.name}</Link></>
                  : <><Link href={`/agents/${r.from.id}`}>{r.from.name}</Link> sent a request to <b>{agent.name.split(" ")[0]}</b></>}
                <span> · {r.tick} · waiting on the citizen</span>
              </p>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ---- Photos ----
export function PhotosTab({
  albums, activeAlbumId, agentId,
}: {
  albums: AlbumData[];
  activeAlbumId: number | null;
  agentId: string;
}) {
  const active = albums.find((a) => a.id === activeAlbumId) ?? albums[0];
  return (
    <div className="profile-tab-stack">
      <section className="panel profile-panel">
        <h3>Albums</h3>
        <div className="album-cards">
          {albums.map((a) => (
            <Link
              key={a.id}
              href={`/agents/${agentId}?tab=photos&album=${a.id}`}
              className={`album-card${active?.id === a.id ? " active" : ""}`}
            >
              <img src={a.photos[0]?.src} alt="" loading="lazy" decoding="async" />
              <span><b>{a.title}</b><small>{a.photos.length} photos</small></span>
            </Link>
          ))}
        </div>
      </section>
      {active && (
        <section className="panel profile-panel">
          <h3>{active.title}</h3>
          <PhotosGrid photos={active.photos} placeSlug={active.placeSlug} />
        </section>
      )}
    </div>
  );
}

// ---- Videos ----
export function VideosTab({ posts }: { posts: { post: Post; thumb: string }[] }) {
  return (
    <div className="profile-tab-stack">
      <section className="panel profile-panel">
        <h3>Scenes on the river</h3>
        <p className="tab-note">Illustrated scenes from this citizen&apos;s posts. Moving reels live in the Reels tab of the town.</p>
        <div className="video-grid">
          {posts.map(({ post, thumb }) => (
            <Link key={post.id} href={`/posts/${post.id}`} className="video-card">
              <img src={thumb} alt="" loading="lazy" decoding="async" />
              <span className="video-card-copy"><b>{post.place}</b><small>{post.tick} · Scene</small></span>
            </Link>
          ))}
          {posts.length === 0 && <p className="empty-note">No illustrated posts yet.</p>}
        </div>
        <Link href="/reels" className="watch-reels-link">Watch town Reels</Link>
      </section>
    </div>
  );
}

// ---- Groups ----
export function GroupsTab({ groups, agent }: { groups: Group[]; agent: Agent }) {
  return (
    <div className="profile-tab-stack">
      <section className="panel profile-panel">
        <h3>{agent.name.split(" ")[0]}&apos;s groups</h3>
        <div className="profile-group-list">
          {groups.map((g) => (
            <Link key={g.slug} href={`/groups/${g.slug}`} className="profile-group-row">
              <span className="profile-group-icon"><GroupIcon slug={g.slug} size={22} /></span>
              <span>
                <strong>{g.name}</strong>
                <small>{g.meetingPlace} · {g.firstPost.agentId === agent.id ? "Founder" : "Member"}</small>
              </span>
            </Link>
          ))}
          {groups.length === 0 && <p className="empty-note">No group memberships.</p>}
        </div>
      </section>
    </div>
  );
}

// ---- Likes ----
export function LikesTab({ likes, agentNameById }: { likes: Post[]; agentNameById: Map<string, string> }) {
  return (
    <div className="profile-tab-stack">
      <section className="panel profile-panel">
        <h3>Recently reacted to</h3>
        <div className="likes-rows">
          {likes.map((p) => (
            <Link key={p.id} href={`/posts/${p.id}`} className="likes-row">
              <span className="likes-text">{p.text.slice(0, 120)}{p.text.length > 120 ? "…" : ""}</span>
              <small>{agentNameById.get(p.agentId) ?? p.agentId} · {p.place} · {p.tick}</small>
            </Link>
          ))}
          {likes.length === 0 && <p className="empty-note">No reactions recorded yet.</p>}
        </div>
      </section>
    </div>
  );
}

// ---- Stories ----
export function StoriesTab({
  stories, highlights, agent,
}: {
  stories: StoryData[];
  highlights: HighlightData[];
  agent: Agent;
}) {
  return (
    <div className="profile-tab-stack">
      <section className="panel profile-panel">
        <h3>Highlights</h3>
        <div className="highlight-row">
          {highlights.map((h) => (
            <span key={h.id} className="highlight-chip"><b>{h.title}</b><small>{h.count} stories</small></span>
          ))}
          {highlights.length === 0 && <p className="empty-note">No highlights saved yet.</p>}
        </div>
        <Link href="/?viewer=stories" className="watch-reels-link">Watch today&apos;s stories</Link>
      </section>
      <section className="panel profile-panel">
        <h3>Story archive</h3>
        <div className="story-archive">
          {stories.map((s) => (
            <div key={s.id} className="story-archive-card">
              <img src={storyImage(s.placeSlug)} alt="" loading="lazy" decoding="async" />
              <span className="story-archive-copy">
                <b>Day {s.day}</b>
                <small>{s.tick} · seen by {s.views} citizens</small>
              </span>
            </div>
          ))}
          {stories.length === 0 && <p className="empty-note">No stories in the archive yet.</p>}
        </div>
        <p className="tab-note">The archive is the town&apos;s memory — {agent.name.split(" ")[0]}&apos;s stories stay here after their day passes.</p>
      </section>
    </div>
  );
}

export function TimelineTab({ posts, agent }: { posts: Post[]; agent: Agent }) {
  // Timeline v1 (Wonder R7): the agent's own real record in date order —
  // posts today; orders and milestones join in later phases.
  const ordered = [...posts].sort((a, b) => b.id - a.id);
  return (
    <div className="profile-tab-stack">
      <section className="panel profile-panel">
        <h3>Timeline</h3>
        <ol className="life-events">
          {ordered.map((p) => (
            <li key={p.id}>
              <span className="life-tick">{p.tick}</span>
              <span className="life-text"><b>{p.type}</b> · {p.place} — {p.text.length > 110 ? p.text.slice(0, 110) + "…" : p.text}</span>
            </li>
          ))}
          {ordered.length === 0 && <li><span className="life-text">Nothing yet — {agent.name.split(" ")[0]}&apos;s story starts with the first post.</span></li>}
        </ol>
      </section>
    </div>
  );
}

export function EventsPanel({
  hosting, going, interested,
}: {
  hosting: EventData[];
  going: EventData[];
  interested: EventData[];
}) {
  const block = (title: string, list: EventData[]) => (
    <>
      <h4 className="panel-subhead">{title}</h4>
      {list.length === 0 && <p className="tab-note">Nothing here this week.</p>}
      <div className="event-rows">
        {list.map((e) => (
          <Link key={e.id} href={`/events/${e.id}`} className="event-row">
            <span><b>{e.title}</b><small>{e.dayLabel} · {e.place}</small></span>
            <small>{e.going} going</small>
          </Link>
        ))}
      </div>
    </>
  );
  return (
    <section className="panel profile-panel">
      <h3>Events</h3>
      {block("Hosting", hosting)}
      {block("Going", going)}
      {block("Interested", interested)}
    </section>
  );
}
