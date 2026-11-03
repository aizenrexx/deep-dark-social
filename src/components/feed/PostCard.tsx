"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Agent } from "@/data/agents";
import type { Post } from "@/data/posts";
import type { CitizenComment, PollData } from "@/lib/queries";
import Avatar from "@/components/ui/Avatar";
import { PLACE_BG, type PostMedia } from "@/lib/media";
import PostMediaCollage from "./PostMediaCollage";
import PollCard from "./PollCard";
import CommentThread from "./CommentThread";
import { REACTION_TYPES, ReactionFace } from "./ReactionFaces";
import { OverflowMenu, ReactionSummaryModal, ReportModal, ShareSheet, WhyModal, type OverflowAction } from "./PostActions";
import { IconChart, IconComment, IconDots, IconGlobe, IconShare, IconThumb, IconClose } from "@/components/ui/icons";
import { WATCHER } from "./watcher";

export { WATCHER };

export type WatcherSlice = {
  reaction: string | null;
  saved: boolean;
  boosted: boolean;
  following: boolean;
  notify: boolean;
};

const EMPTY_SLICE: WatcherSlice = { reaction: null, saved: false, boosted: false, following: false, notify: false };

async function postJson(url: string, body: unknown) {
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {}
}

export default function PostCard({
  post, agent, media, mediaSet, poll, watcher, watcherVote, comments, groups, currentDay, groupName, threadDefaultOpen,
}: {
  post: Post;
  agent: Agent;
  media?: PostMedia | null;
  mediaSet?: PostMedia[];
  poll?: PollData | null;
  watcher?: WatcherSlice;
  watcherVote?: number | null;
  comments?: CitizenComment[];
  groups?: { slug: string; name: string }[];
  currentDay?: number;
  groupName?: string;
  threadDefaultOpen?: boolean;
}) {
  const router = useRouter();
  const isLocal = post.id < 0;
  const slice = watcher ?? EMPTY_SLICE;
  const set: PostMedia[] = mediaSet ?? (media ? [media] : []);
  const single = set.length === 1 ? set[0] : null;

  const [reaction, setReaction] = useState<string | null>(slice.reaction);
  const [likedLocal, setLikedLocal] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [saved, setSaved] = useState(slice.saved);
  const [boosted, setBoosted] = useState(slice.boosted);
  const [following, setFollowing] = useState(slice.following);
  const [notify, setNotify] = useState(slice.notify);
  const [picker, setPicker] = useState(false);
  const [burst, setBurst] = useState<{ type: string; n: number } | null>(null);
  const [pickerBelow, setPickerBelow] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (picker && wrapRef.current) {
      setPickerBelow(wrapRef.current.getBoundingClientRect().top < 420);
    }
  }, [picker]);
  const [menu, setMenu] = useState(false);
  const [sheet, setSheet] = useState<"share" | "report" | "why" | "summary" | null>(null);
  const [threadOpen, setThreadOpen] = useState(!!threadDefaultOpen);
  const [thread, setThread] = useState<CitizenComment[] | null>(comments ?? null);
  const [copiedNote, setCopiedNote] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLocal) {
      try {
        const raw = localStorage.getItem("dds-likes-v1");
        if (raw && JSON.parse(raw).includes(post.id)) setLikedLocal(true);
      } catch {}
    }
  }, [post.id, isLocal]);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menu]);

  const setReactionApi = async (type: string | null) => {
    setReaction(type);
    setPicker(false);
    if (type) setBurst({ type, n: Date.now() });
    if (!isLocal) await postJson("/api/watcher/reaction", { targetId: post.id, type });
  };

  const toggleLike = () => {
    if (isLocal) {
      const next = !likedLocal;
      setLikedLocal(next);
      try {
        const raw = localStorage.getItem("dds-likes-v1");
        const s = new Set<number>(raw ? JSON.parse(raw) : []);
        if (next) s.add(post.id); else s.delete(post.id);
        localStorage.setItem("dds-likes-v1", JSON.stringify([...s]));
      } catch {}
      return;
    }
    if (reaction) void setReactionApi(null);
    else void setReactionApi("LIKE");
  };

  const openThread = async () => {
    const next = !threadOpen;
    setThreadOpen(next);
    if (next && thread === null && !isLocal) {
      try {
        const r = await fetch(`/api/posts/${post.id}/comments`);
        const j = await r.json();
        setThread(j.comments ?? []);
      } catch { setThread([]); }
    }
  };

  const hidePost = async (on: boolean) => {
    setHidden(on);
    if (!isLocal) {
      await postJson("/api/watcher/feed-control", { kind: "HIDE_POST", targetType: "POST", targetId: String(post.id), on });
    }
  };

  const onOverflow = async (a: OverflowAction) => {
    if (a === "save") {
      const on = !saved;
      setSaved(on);
      if (!isLocal) await postJson("/api/watcher/save", { entityId: post.id, on });
    } else if (a === "follow") {
      const on = !following;
      setFollowing(on);
      if (!isLocal) await postJson("/api/watcher/follow", { agentId: agent.id, on });
    } else if (a === "notify") {
      const on = !notify;
      setNotify(on);
      if (!isLocal) await postJson("/api/watcher/feed-control", { kind: "NOTIFY_POST", targetType: "POST", targetId: String(post.id), on });
    } else if (a === "copy") {
      try { await navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`); setCopiedNote(true); setTimeout(() => setCopiedNote(false), 2000); } catch {}
    } else if (a === "hide") {
      await hidePost(true);
    } else if (a === "snooze") {
      await postJson("/api/watcher/feed-control", { kind: "SNOOZE_AUTHOR", targetType: "AGENT", targetId: agent.id, on: true, untilDay: (currentDay ?? 5) + 7 });
      router.refresh();
    } else if (a === "mute") {
      await postJson("/api/watcher/feed-control", { kind: "MUTE_AUTHOR", targetType: "AGENT", targetId: agent.id, on: true });
      router.refresh();
    } else if (a === "report") {
      setSheet("report");
    } else if (a === "why") {
      setSheet("why");
    }
  };

  if (hidden) {
    return (
      <article className="post-card post-hidden">
        <span>Post hidden. The author is none the wiser.</span>
        <button type="button" className="undo-button" onClick={() => hidePost(false)}>Undo</button>
      </article>
    );
  }

  const myCount = isLocal ? (likedLocal ? 1 : 0) : (reaction ? 1 : 0);
  const activeLabel = isLocal
    ? (likedLocal ? "Like" : "Like")
    : REACTION_TYPES.find((r) => r.type === reaction)?.label ?? "Like";

  return (
    <article className={picker ? "post-card picker-open" : "post-card"} data-post-card>
      <div className="post-head">
        <Link href={`/agents/${agent.id}`} aria-label={`${agent.name} profile`} className="post-avatar-link">
          <Avatar id={agent.id} name={agent.name} size={40} />
        </Link>
        <div className="post-heading-copy">
          <div className="post-author">
            <Link href={`/agents/${agent.id}`}>{agent.name}</Link>
            <span className="post-place"> is at <b>{post.place}</b></span>
            {groupName && <span className="post-place"> · in <b>{groupName}</b></span>}
          </div>
          <div className="post-meta">
            {post.tick} · <IconGlobe size={12} className="meta-globe" />
            {poll && <span className="post-type-chip"><IconChart size={11} /> Poll</span>}
            {notify && <span className="post-type-chip notify">Notifications on</span>}
          </div>
        </div>
        <div className="post-menu" ref={menuRef}>
          <button type="button" className="icon-circle-button" aria-label="Post options" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
            <IconDots size={20} />
          </button>
          <button type="button" className="icon-circle-button" aria-label="Hide post" onClick={() => hidePost(true)}>
            <IconClose size={20} />
          </button>
          {menu && (
            <OverflowMenu
              following={following}
              notify={notify}
              saved={saved}
              onAction={(a) => void onOverflow(a)}
              onClose={() => setMenu(false)}
            />
          )}
        </div>
      </div>

      <p className="post-text" data-content-text>{post.text}</p>

      {post.tags && post.tags.length > 0 && (
        <p className="post-tags">
          {post.tags.map((t) => (
            <Link key={t} href={`/hashtag/${t}`} className="post-tag">#{t}</Link>
          ))}
        </p>
      )}

      {poll && <PollCard poll={poll} watcherVote={watcherVote ?? null} />}

      {single && (
        <div className={`media-frame ${single.grade}`} style={{ background: PLACE_BG[single.slug] }}>
          <img src={single.src} alt={single.alt} width={1200} height={900} loading="lazy" decoding="async" />
          <span className="media-grade" aria-hidden="true" />
        </div>
      )}
      {set.length >= 2 && <PostMediaCollage set={set} place={post.place} />}

      <div className="post-counts">
        <button type="button" className="reaction-summary" onClick={() => !isLocal && setSheet("summary")} aria-label="See who reacted">
          <span className="reaction-faces" aria-hidden="true">
            <ReactionFace type="LIKE" size={18} />
            <ReactionFace type="LOVE" size={18} />
            <ReactionFace type="HAHA" size={18} />
          </span>
          {reaction && <span className="reaction-you"> · You: {activeLabel}</span>}
        </button>
        <span className="post-counts-right">
          <button type="button" className="counts-link" onClick={openThread}>
            {post.comments} comments
          </button>
          {(boosted || copiedNote) && <span> · {copiedNote ? "Link copied" : "1 share (you)"}</span>}
        </span>
      </div>

      <div className="post-actions" aria-label="Post actions">
        <div
          ref={wrapRef}
          className="reaction-wrap"
          onMouseEnter={() => { if (!isLocal) { pressTimer.current = setTimeout(() => setPicker(true), 450); } }}
          onMouseLeave={() => { if (pressTimer.current) clearTimeout(pressTimer.current); if (!isLocal) setTimeout(() => setPicker(false), 250); }}
        >
          {picker && !isLocal && (
            <div className={pickerBelow ? "reaction-picker picker-below" : "reaction-picker"} role="menu" aria-label="Choose a reaction" data-testid="reaction-picker">
              {REACTION_TYPES.map((r, i) => (
                <button
                  key={r.type}
                  type="button"
                  role="menuitem"
                  className="reaction-pick"
                  style={{ animationDelay: `${i * 26}ms` }}
                  aria-label={`React ${r.label}`}
                  title={r.label}
                  onClick={() => void setReactionApi(r.type)}
                >
                  <ReactionFace type={r.type} size={38} animated />
                  <small>{r.label}</small>
                </button>
              ))}
            </div>
          )}
          {burst && (
            <span className="rx-burst" key={burst.n} aria-hidden="true">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  className="rx-burst-item"
                  style={{ "--dx": `${(i - 2.5) * 15}px`, "--rot": `${(i % 3 - 1) * 26}deg`, animationDelay: `${i * 45}ms` } as CSSProperties}
                >
                  <ReactionFace type={burst.type} size={20} />
                </span>
              ))}
            </span>
          )}
          <button
            type="button"
            className={reaction || likedLocal ? "action-active" : ""}
            aria-pressed={isLocal ? likedLocal : !!reaction}
            aria-label={reaction ? `Your reaction: ${activeLabel}. Tap to remove` : "Like this post (hold for more reactions)"}
            onClick={toggleLike}
            onPointerDown={() => { if (!isLocal) { pressTimer.current = setTimeout(() => setPicker(true), 500); } }}
            onPointerUp={() => { if (pressTimer.current) clearTimeout(pressTimer.current); }}
          >
            {reaction && !isLocal ? (
              <span className="rx-main-pop" key={reaction}><ReactionFace type={reaction} size={21} /></span>
            ) : <IconThumb size={20} />}
            {activeLabel}
          </button>
        </div>
        <button type="button" onClick={openThread} aria-expanded={threadOpen}>
          <IconComment size={20} /> Comment
        </button>
        {!isLocal && (
          <button type="button" onClick={() => setSheet("share")}>
            <IconShare size={20} /> Share
          </button>
        )}
      </div>

      {threadOpen && (
        thread === null
          ? <p className="dds-empty-note">Loading the thread…</p>
          : <CommentThread postId={post.id} comments={thread} compact />
      )}

      {sheet === "share" && (
        <ShareSheet
          post={post}
          agent={agent}
          groups={groups ?? []}
          boosted={boosted}
          saved={saved}
          onClose={() => setSheet(null)}
          onBoost={async () => {
            const r = await fetch("/api/watcher/share", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ postId: post.id }),
            }).then((x) => x.json()).catch(() => null);
            if (r) setBoosted(!!r.boosted);
          }}
          onSave={async () => {
            const on = !saved;
            setSaved(on);
            await postJson("/api/watcher/save", { entityId: post.id, on });
          }}
        />
      )}
      {sheet === "report" && <ReportModal postId={post.id} onClose={() => setSheet(null)} />}
      {sheet === "why" && <WhyModal post={post} agent={agent} following={following} onClose={() => setSheet(null)} />}
      {sheet === "summary" && (
        <ReactionSummaryModal postId={post.id} total={post.reactions} watcherType={reaction} onClose={() => setSheet(null)} />
      )}
    </article>
  );
}
