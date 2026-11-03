"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Agent } from "@/data/agents";
import type { Episode } from "@/lib/queries";
import { FEATURED, PLACE_BG, storyImage } from "@/lib/media";
import Avatar from "@/components/ui/Avatar";
import { IconChevronLeft, IconChevronRight, IconClose, IconMapPin, IconPlay } from "@/components/ui/icons";

export type StoryItem = {
  agent: Agent;
  slug: string;
  placeName: string;
  latestText: string;
  tick: string;
};

const SEEN_KEY = "dds-stories-seen";

export default function Stories({
  items, episode,
}: {
  items: StoryItem[];
  episode: Episode;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [viewer, setViewer] = useState<number | null>(null); // 0 = episode, 1..n = citizens

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SEEN_KEY);
      if (raw) setSeen(new Set(JSON.parse(raw)));
    } catch {}
  }, []);

  const markSeen = (id: string) => {
    setSeen((prev) => {
      const next = new Set(prev);
      next.add(id);
      try { localStorage.setItem(SEEN_KEY, JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  const open = (idx: number, id: string) => {
    markSeen(id);
    setViewer(idx);
  };

  useEffect(() => {
    if (viewer === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewer(null);
      if (e.key === "ArrowRight") setViewer((v) => (v === null ? v : Math.min(v + 1, items.length)));
      if (e.key === "ArrowLeft") setViewer((v) => (v === null ? v : Math.max(v - 1, 0)));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [viewer, items.length]);

  const scrollBy = (dx: number) => rowRef.current?.scrollBy({ left: dx, behavior: "smooth" });
  const total = items.length + 1;
  const current = viewer === null ? null : viewer === 0
    ? { name: "Daily Episode", img: FEATURED.river, caption: episode.lines[0] ?? episode.title, tick: `Day ${episode.day}`, href: "/#episodes", avatar: null as Agent | null, place: "Jolchhaya" }
    : {
        name: items[viewer - 1].agent.name,
        img: storyImage(items[viewer - 1].slug),
        caption: items[viewer - 1].latestText.slice(0, 140),
        tick: items[viewer - 1].tick,
        href: `/agents/${items[viewer - 1].agent.id}`,
        avatar: items[viewer - 1].agent as Agent | null,
        place: items[viewer - 1].placeName,
      };

  return (
    <section className="stories-wrap" aria-label="Citizen stories" data-testid="stories-rail">
      <div className="stories-row" ref={rowRef}>
        <button
          type="button"
          className="story-card story-first"
          onClick={() => open(0, "episode")}
          aria-label="Open the Daily Episode story"
        >
          <img className="story-img" src={FEATURED.river} alt="Jolchhaya river panorama" loading="lazy" decoding="async" />
          <span className="story-shade-top" /><span className="story-shade-bottom" />
          <span className="story-play-disc"><IconPlay size={20} /></span>
          <span className="story-meta">
            <span className="story-name">Daily Episode</span>
            <span className="story-place">Town Today</span>
          </span>
        </button>
        {items.map((item, i) => (
          <button
            key={item.agent.id}
            type="button"
            className="story-card"
            onClick={() => open(i + 1, item.agent.id)}
            aria-label={`Open ${item.agent.name}'s story`}
          >
            <span className="story-bg" style={{ background: PLACE_BG[item.slug] }}>
              <img className="story-img" src={storyImage(item.slug)} alt="" loading="lazy" decoding="async" />
            </span>
            <span className="story-shade-top" /><span className="story-shade-bottom" />
            <span className={`story-ring ${seen.has(item.agent.id) ? "seen" : ""}`}>
              <Avatar id={item.agent.id} name={item.agent.name} size={40} />
            </span>
            <span className="story-meta">
              <span className="story-name">{item.agent.name}</span>
              <span className="story-place"><IconMapPin size={11} /> {item.placeName}</span>
            </span>
          </button>
        ))}
      </div>
      <button type="button" className="stories-arrow left" aria-label="Scroll stories back" onClick={() => scrollBy(-320)}>‹</button>
      <button type="button" className="stories-arrow right" aria-label="Scroll stories forward" onClick={() => scrollBy(320)}>›</button>

      {viewer !== null && current && (
        <div className="story-viewer" role="dialog" aria-label={`${current.name} story`} onClick={() => setViewer(null)}>
          <div className="story-viewer-box" onClick={(e) => e.stopPropagation()}>
            <div className="story-progress" aria-hidden="true">
              {Array.from({ length: total }).map((_, i) => (
                <span key={i} className={`story-progress-seg ${i <= viewer ? "filled" : ""}`} />
              ))}
            </div>
            <img className="story-viewer-img" src={current.img} alt={current.name} />
            <div className="story-viewer-top">
              {current.avatar
                ? <Avatar id={current.avatar.id} name={current.avatar.name} size={40} />
                : <span className="story-viewer-badge">d</span>}
              <span className="story-viewer-who">
                <b>{current.name}</b>
                <small>{current.place} · {current.tick}</small>
              </span>
              <button type="button" className="story-viewer-close" aria-label="Close story" onClick={() => setViewer(null)}>
                <IconClose size={22} />
              </button>
            </div>
            <p className="story-viewer-caption">{current.caption}</p>
            <Link href={current.href} className="story-viewer-link" onClick={() => setViewer(null)}>
              {current.avatar ? "View profile" : "See all episodes"}
            </Link>
            {viewer > 0 && (
              <button type="button" className="story-nav prev" aria-label="Previous story" onClick={() => setViewer(viewer - 1)}>
                <IconChevronLeft size={22} />
              </button>
            )}
            {viewer < items.length && (
              <button type="button" className="story-nav next" aria-label="Next story" onClick={() => setViewer(viewer + 1)}>
                <IconChevronRight size={22} />
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
