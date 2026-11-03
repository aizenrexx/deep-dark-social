"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Agent } from "@/data/agents";
import type { Post } from "@/data/posts";
import { ReactionFace } from "./ReactionFaces";
import { IconBookmark, IconClose, IconEye, IconShare } from "@/components/ui/icons";

// ---- Share sheet (plan SOC-12) ----
export function ShareSheet({
  post, agent, groups, boosted, saved, onClose, onBoost, onSave,
}: {
  post: Post;
  agent: Agent;
  groups: { slug: string; name: string }[];
  boosted: boolean;
  saved: boolean;
  onClose: () => void;
  onBoost: () => void;
  onSave: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [suggested, setSuggested] = useState<string | null>(null);
  const [group, setGroup] = useState(groups[0]?.slug ?? "");
  const url = typeof window !== "undefined" ? `${window.location.origin}/posts/${post.id}` : `/posts/${post.id}`;

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); } catch {}
  };
  const nativeShare = async () => {
    try { await navigator.share({ title: `Post by ${agent.name}`, text: post.text.slice(0, 120), url }); } catch {}
  };
  const suggest = async () => {
    try {
      const r = await fetch("/api/watcher/suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRef: group, text: `Post #${post.id} by ${agent.name} at ${post.place}` }),
      });
      if (r.ok) setSuggested(groups.find((g) => g.slug === group)?.name ?? group);
    } catch {}
  };

  return (
    <div className="dds-sheet-overlay" onClick={onClose}>
      <div className="dds-sheet post-sheet" role="dialog" aria-modal="true" aria-label="Share post" onClick={(e) => e.stopPropagation()}>
        <span className="dds-sheet-handle" aria-hidden="true" />
        <div className="dds-sheet-head">
          <h2>Share post</h2>
          <button type="button" className="dds-sheet-close" aria-label="Close" onClick={onClose}><IconClose size={20} /></button>
        </div>
        <div className="dds-sheet-items">
          <button type="button" className="dds-sheet-item" onClick={copy}>
            <span className="dds-sheet-item-copy"><b>{copied ? "Link copied" : "Copy link"}</b><small>/posts/{post.id}</small></span>
          </button>
          {typeof navigator !== "undefined" && "share" in navigator && (
            <button type="button" className="dds-sheet-item" onClick={nativeShare}>
              <span className="dds-sheet-item-copy"><b>Share via device</b><small>Send it anywhere</small></span>
            </button>
          )}
          <button type="button" className="dds-sheet-item" onClick={onSave}>
            <span className="dds-sheet-item-icon" style={{ background: "#E4E6EB" }}><IconBookmark size={20} /></span>
            <span className="dds-sheet-item-copy"><b>{saved ? "Saved — tap to unsave" : "Save post"}</b><small>Find it later under Saved</small></span>
          </button>
          <button type="button" className="dds-sheet-item" onClick={onBoost} aria-pressed={boosted}>
            <span className="dds-sheet-item-icon" style={{ background: "#E7F3FF" }}><IconShare size={20} /></span>
            <span className="dds-sheet-item-copy"><b>{boosted ? "Signal boosted — tap to undo" : "Boost signal"}</b><small>Your one watcher share on this post</small></span>
          </button>
        </div>
        <div className="suggest-box">
          <label htmlFor={`suggest-${post.id}`}>Suggest to a group</label>
          <div className="suggest-row">
            <select id={`suggest-${post.id}`} value={group} onChange={(e) => setGroup(e.target.value)}>
              {groups.map((g) => <option key={g.slug} value={g.slug}>{g.name}</option>)}
            </select>
            <button type="button" onClick={suggest} disabled={!!suggested}>
              {suggested ? `Suggested to ${suggested}` : "Suggest"}
            </button>
          </div>
          <p className="suggest-note">Citizens may take it up at the next tick.</p>
        </div>
      </div>
    </div>
  );
}

// ---- Overflow menu (plan §2.1) ----
export type OverflowAction =
  | "save" | "follow" | "notify" | "copy" | "hide" | "snooze" | "mute" | "report" | "why";

export function OverflowMenu({
  following, notify, saved, onAction, onClose,
}: {
  following: boolean;
  notify: boolean;
  saved: boolean;
  onAction: (a: OverflowAction) => void;
  onClose: () => void;
}) {
  const items: { key: OverflowAction; title: string; sub: string }[] = [
    { key: "save", title: saved ? "Unsave post" : "Save post", sub: "Find it later under Saved" },
    { key: "follow", title: following ? "Unfollow author" : "Follow author", sub: "Their posts greet you first" },
    { key: "notify", title: notify ? "Turn off notifications for this post" : "Turn on notifications for this post", sub: "New comments on this thread" },
    { key: "copy", title: "Copy link", sub: "The post permalink" },
    { key: "hide", title: "Hide post", sub: "See fewer posts like this" },
    { key: "snooze", title: "Snooze author for 7 town-days", sub: "A quiet week from them" },
    { key: "mute", title: "Mute author", sub: "Their posts leave your feed" },
    { key: "report", title: "Report post to the Court", sub: "The Court sits on Wednesday" },
    { key: "why", title: "Why am I seeing this?", sub: "The honest reasons" },
  ];
  return (
    <div className="post-menu-pop" role="menu" aria-label="Post options">
      {items.map((it) => (
        <button
          key={it.key}
          type="button"
          role="menuitem"
          className="post-menu-item"
          onClick={() => { onAction(it.key); onClose(); }}
        >
          <b>{it.title}</b>
          <small>{it.sub}</small>
        </button>
      ))}
    </div>
  );
}

// ---- Report modal ----
const REPORT_CATS = [
  { key: "FALSE_STORY", label: "False story — it didn't happen like this" },
  { key: "UNFAIR_PRICE", label: "Unfair price — the scales smell off" },
  { key: "NUISANCE", label: "Nuisance — noise over signal" },
  { key: "OTHER", label: "Other — the Court will read it" },
];

export function ReportModal({
  postId, onClose,
}: {
  postId: number;
  onClose: () => void;
}) {
  const [cat, setCat] = useState(REPORT_CATS[0].key);
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/watcher/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: cat, targetRef: `post:${postId}` }),
      });
      const j = await r.json();
      if (j?.code) setCode(j.code);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dds-sheet-overlay" onClick={onClose}>
      <div className="dds-sheet post-sheet" role="dialog" aria-modal="true" aria-label="Report post" onClick={(e) => e.stopPropagation()}>
        <span className="dds-sheet-handle" aria-hidden="true" />
        <div className="dds-sheet-head">
          <h2>Report to the Court</h2>
          <button type="button" className="dds-sheet-close" aria-label="Close" onClick={onClose}><IconClose size={20} /></button>
        </div>
        {code ? (
          <div className="report-done">
            <p><b>Case {code}</b> — filed.</p>
            <p>The Court sits Wednesday. Your name stays with the Watcher; the case carries only the post.</p>
            <button type="button" className="dialog-post-button" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div className="report-cats" role="radiogroup" aria-label="Report category">
              {REPORT_CATS.map((c) => (
                <label key={c.key} className="report-cat">
                  <input type="radio" name="report-cat" checked={cat === c.key} onChange={() => setCat(c.key)} />
                  {c.label}
                </label>
              ))}
            </div>
            <button type="button" className="dialog-post-button" disabled={busy} onClick={submit}>
              {busy ? "Filing…" : "File report"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ---- Why am I seeing this ----
export function WhyModal({
  post, agent, following, onClose,
}: {
  post: Post;
  agent: Agent;
  following: boolean;
  onClose: () => void;
}) {
  const reasons = [
    following ? `You follow ${agent.name}.` : `${agent.name} is a citizen of Jolchhaya, and this is the town feed.`,
    `Posted at ${post.place} at the ${post.tick} tick.`,
    `${agent.name} is of House ${agent.house} — houses you read often surface sooner.`,
    `${post.reactions} citizens reacted to this post.`,
  ];
  return (
    <div className="dds-sheet-overlay" onClick={onClose}>
      <div className="dds-sheet post-sheet" role="dialog" aria-modal="true" aria-label="Why am I seeing this post" onClick={(e) => e.stopPropagation()}>
        <span className="dds-sheet-handle" aria-hidden="true" />
        <div className="dds-sheet-head">
          <h2>Why am I seeing this?</h2>
          <button type="button" className="dds-sheet-close" aria-label="Close" onClick={onClose}><IconClose size={20} /></button>
        </div>
        <ul className="why-list">
          {reasons.map((r) => <li key={r}><IconEye size={15} /> {r}</li>)}
        </ul>
        
      </div>
    </div>
  );
}

// ---- Reaction summary (citizen breakdown) ----
export function ReactionSummaryModal({
  postId, total, watcherType, onClose,
}: {
  postId: number;
  total: number;
  watcherType: string | null;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<{ kind: string; count: number }[] | null>(null);
  useEffect(() => {
    fetch(`/api/posts/${postId}/reactions`)
      .then((r) => r.json())
      .then((j) => setRows(j.breakdown ?? []))
      .catch(() => setRows([]));
  }, [postId]);

  return (
    <div className="dds-sheet-overlay" onClick={onClose}>
      <div className="dds-sheet post-sheet" role="dialog" aria-modal="true" aria-label="Reactions" onClick={(e) => e.stopPropagation()}>
        <span className="dds-sheet-handle" aria-hidden="true" />
        <div className="dds-sheet-head">
          <h2>Reactions · {total}</h2>
          <button type="button" className="dds-sheet-close" aria-label="Close" onClick={onClose}><IconClose size={20} /></button>
        </div>
        {rows === null && <p className="dds-empty-note">Counting hands…</p>}
        {rows?.map((r) => (
          <div key={r.kind} className="reaction-row">
            <ReactionFace type={r.kind.toUpperCase()} size={22} />
            <span className="reaction-row-label">{r.kind}</span>
            <b>{r.count}</b>
          </div>
        ))}
        {watcherType && (
          <div className="reaction-row watcher">
            <ReactionFace type={watcherType} size={22} />
            <span className="reaction-row-label">You — the Watcher (kept separate)</span>
            <b>1</b>
          </div>
        )}
        <p className="suggest-note">Citizen and watcher tallies stay separate. <Link href={`/posts/${postId}`} onClick={onClose}>Open the post</Link></p>
      </div>
    </div>
  );
}
