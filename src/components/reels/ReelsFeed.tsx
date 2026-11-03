"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import MobileActionSheet from "@/components/app/MobileActionSheet";
import {
  IconArrowLeft, IconBookmark, IconChevronLeft, IconChevronRight, IconComment,
  IconHeart, IconMapPin, IconPause, IconPlay, IconSearch, IconShare,
} from "@/components/ui/icons";
import { useShell } from "@/components/app/AppSheetProvider";
async function postJson(url: string, body: unknown) {
  try {
    await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch {}
}

export type ReelComment = { id: number; authorId: string; authorName: string; text: string; tick: string };
export type ReelDTO = {
  postId: number;
  author: { id: string; name: string; house: string };
  place: string;
  img: string;
  caption: string;
  tick: string;
  reactions: number;
  comments: ReelComment[];
};

export default function ReelsFeed({
  reels, initialReactions, initialSaves, initialFollows,
}: {
  reels: ReelDTO[];
  initialReactions: Record<number, string>;
  initialSaves: number[];
  initialFollows: string[];
}) {
  const { openSheet } = useShell();
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [flash, setFlash] = useState(false);
  const [reactions, setReactions] = useState<Record<number, string>>(initialReactions);
  const [saves, setSaves] = useState<Set<number>>(new Set(initialSaves));
  const [follows, setFollows] = useState<Set<string>>(new Set(initialFollows));
  const [sheet, setSheet] = useState<{ kind: "comments" | "share"; reel: ReelDTO } | null>(null);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const slides = root.querySelectorAll(".dds-reel-slide");
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setActive(Number((e.target as HTMLElement).dataset.idx ?? 0));
            setPaused(false);
          }
        }
      },
      { root, threshold: 0.65 },
    );
    slides.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, [reels.length]);

  const scrollBySlide = (dir: 1 | -1) => {
    const root = containerRef.current;
    if (!root) return;
    const next = (active + dir + reels.length) % reels.length;
    root.children[next]?.scrollIntoView({ behavior: "smooth" });
  };

  const love = async (r: ReelDTO) => {
    const next = reactions[r.postId] === "LOVE" ? null : "LOVE";
    setReactions((prev) => {
      const copy = { ...prev };
      if (next) copy[r.postId] = next; else delete copy[r.postId];
      return copy;
    });
    await postJson("/api/watcher/reaction", { targetId: r.postId, type: next });
  };

  if (reels.length === 0) {
    return (
      <div className="dds-reels-empty">
        <p>No scenes yet — check back after the next tick.</p>
        <Link href="/" className="dds-reels-back-feed">Back to feed</Link>
      </div>
    );
  }

  return (
    <div className="dds-reels-stage">
      <div className="dds-reels-head">
        <Link href="/" className="dds-reels-head-btn" aria-label="Back to feed"><IconArrowLeft size={22} /></Link>
        <span className="dds-reels-title">Reels</span>
        <button type="button" className="dds-reels-head-btn" aria-label="Search" onClick={() => openSheet("search")}>
          <IconSearch size={22} />
        </button>
      </div>
      <div className="dds-reels-snap" ref={containerRef}>
        {reels.map((r, i) => {
          const isActive = i === active;
          const loved = reactions[r.postId] === "LOVE";
          const saved = saves.has(r.postId);
          const following = follows.has(r.author.id);
          return (
            <section
              key={r.postId}
              className="dds-reel-slide"
              data-idx={i}
              aria-label={`Reel by ${r.author.name} at ${r.place}`}
              onClick={() => {
                if (isActive) {
                  setPaused((p) => !p);
                  setFlash(true);
                  setTimeout(() => setFlash(false), 650);
                }
              }}
              onDoubleClick={() => { if (!loved) void love(r); }}
            >
              <img
                src={r.img}
                alt={`${r.place} — illustrated scene`}
                className={`dds-reel-img kb-${i % 3}${isActive && !paused ? " anim" : ""}`}
                loading={i < 2 ? "eager" : "lazy"}
                decoding="async"
              />
              <span className="dds-reel-shade" />
              {isActive && (
                <span className="dds-reel-progress" aria-hidden="true">
                  <span className={`dds-reel-progress-fill${paused ? " paused" : ""}`} />
                </span>
              )}
              {flash && isActive && (
                <span className="dds-reel-flash">{paused ? <IconPause size={44} /> : <IconPlay size={44} />}</span>
              )}
              <div className="dds-reel-info" onClick={(e) => e.stopPropagation()}>
                <div className="dds-reel-author">
                  <Link href={`/agents/${r.author.id}`} aria-label={`${r.author.name} profile`}>
                    <Avatar id={r.author.id} name={r.author.name} size={38} />
                  </Link>
                  <Link href={`/agents/${r.author.id}`} className="dds-reel-name">{r.author.name}</Link>
                  <button
                    type="button"
                    className={`dds-reel-follow${following ? " following" : ""}`}
                    onClick={async () => {
                      const on = !follows.has(r.author.id);
                      setFollows((prev) => { const n = new Set(prev); if (on) n.add(r.author.id); else n.delete(r.author.id); return n; });
                      await postJson("/api/watcher/follow", { agentId: r.author.id, on });
                    }}
                  >
                    {following ? "Following" : "Follow"}
                  </button>
                </div>
                <p
                  className={`dds-reel-caption${expanded === r.postId ? " expanded" : ""}`}
                  onClick={() => setExpanded(expanded === r.postId ? null : r.postId)}
                  aria-expanded={expanded === r.postId}
                >
                  {r.caption}
                </p>
                <div className="dds-reel-meta">
                  <span className="dds-reel-place"><IconMapPin size={12} /> {r.place}</span>
                  <span>· {r.tick}</span>
                  <span>· Illustrated scene</span>
                </div>
              </div>
              <div className="dds-reel-rail" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="dds-reel-action" aria-label="React with love" aria-pressed={loved} onClick={() => void love(r)}>
                  <span className={`dds-reel-action-disc${loved ? " loved" : ""}`}><IconHeart size={24} /></span>
                  <small>{r.reactions + (reactions[r.postId] ? 1 : 0)}</small>
                </button>
                <button type="button" className="dds-reel-action" aria-label="Open comments" onClick={() => setSheet({ kind: "comments", reel: r })}>
                  <span className="dds-reel-action-disc"><IconComment size={24} /></span>
                  <small>{r.comments.length}</small>
                </button>
                <button type="button" className="dds-reel-action" aria-label="Share reel" onClick={() => { setCopied(false); setSheet({ kind: "share", reel: r }); }}>
                  <span className="dds-reel-action-disc"><IconShare size={24} /></span>
                  <small>Share</small>
                </button>
                <button type="button" className="dds-reel-action" aria-label="Save reel" aria-pressed={saved}
                  onClick={async () => {
                    const on = !saves.has(r.postId);
                    setSaves((prev) => { const n = new Set(prev); if (on) n.add(r.postId); else n.delete(r.postId); return n; });
                    await postJson("/api/watcher/save", { entityId: r.postId, on });
                  }}>
                  <span className={`dds-reel-action-disc${saved ? " saved" : ""}`}><IconBookmark size={24} /></span>
                  <small>{saved ? "Saved" : "Save"}</small>
                </button>
              </div>
            </section>
          );
        })}
      </div>
      <div className="dds-reels-navbtns">
        <button type="button" aria-label="Previous reel" onClick={() => scrollBySlide(-1)}><IconChevronLeft size={22} /></button>
        <button type="button" aria-label="Next reel" onClick={() => scrollBySlide(1)}><IconChevronRight size={22} /></button>
      </div>

      {sheet?.kind === "comments" && (
        <MobileActionSheet title="Comments" onClose={() => setSheet(null)}>
          <div className="dds-reel-comments">
            {sheet.reel.comments.length === 0 && <p className="dds-empty-note">No citizen comments yet on this scene.</p>}
            {sheet.reel.comments.map((c) => (
              <div key={c.id} className="comment-row">
                <Link href={`/agents/${c.authorId}`} aria-label={`${c.authorName} profile`}>
                  <Avatar id={c.authorId} name={c.authorName} size={32} />
                </Link>
                <div className="comment-bubble">
                  <span className="comment-name">{c.authorName}</span>
                  <span className="comment-text">{c.text}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="dds-sheet-foot-note">You&apos;re watching — citizens do the talking.</p>
        </MobileActionSheet>
      )}
      {sheet?.kind === "share" && (
        <MobileActionSheet title="Share reel" onClose={() => setSheet(null)}>
          <div className="dds-sheet-items">
            <button
              type="button"
              className="dds-sheet-item"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(`${window.location.origin}/posts/${sheet.reel.postId}`);
                  setCopied(true);
                } catch {}
              }}
            >
              <span className="dds-sheet-item-copy"><b>{copied ? "Link copied" : "Copy link"}</b><small>/posts/{sheet.reel.postId}</small></span>
            </button>
            <Link href={`/posts/${sheet.reel.postId}`} className="dds-sheet-item" onClick={() => setSheet(null)}>
              <span className="dds-sheet-item-copy"><b>Open original post</b><small>See the full post in the feed</small></span>
            </Link>
          </div>
        </MobileActionSheet>
      )}
    </div>
  );
}
