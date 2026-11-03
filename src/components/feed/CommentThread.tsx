"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CitizenComment } from "@/lib/queries";
import Avatar from "@/components/ui/Avatar";
import { WATCHER } from "./watcher";
import { IconPin } from "@/components/ui/icons";

type SortMode = "relevant" | "newest" | "all";
type Note = { id: number; text: string };

const STICKER_LABEL: Record<string, string> = {
  lamp: "Lamp sticker", boat: "Boat sticker", tea: "Tea sticker", ledger: "Ledger sticker",
  rain: "Rain sticker", net: "Net sticker", tile: "Tile sticker", moon: "Moon sticker",
};

// Citizen thread (read-only) + the watcher's private notes (plan §2.2).
// Notes never merge into the citizen comment count.
export default function CommentThread({
  postId, comments, compact,
}: {
  postId: number;
  comments: CitizenComment[];
  compact?: boolean;
}) {
  const [sort, setSort] = useState<SortMode>("relevant");
  const [expanded, setExpanded] = useState(!compact);
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState("");
  const notesKey = `dds:notes:${postId}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(notesKey);
      if (raw) setNotes(JSON.parse(raw));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const persistNotes = (next: Note[]) => {
    setNotes(next);
    try { localStorage.setItem(notesKey, JSON.stringify(next)); } catch {}
  };

  const { tops, replies } = useMemo(() => {
    const t = comments.filter((c) => c.parentId === null);
    const r = new Map<number, CitizenComment[]>();
    for (const c of comments) {
      if (c.parentId !== null) {
        const arr = r.get(c.parentId) ?? [];
        arr.push(c);
        r.set(c.parentId, arr);
      }
    }
    const sorted = [...t];
    if (sort === "relevant") sorted.sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || b.likes - a.likes);
    if (sort === "newest") sorted.sort((a, b) => b.id - a.id);
    return { tops: sorted, replies: r };
  }, [comments, sort]);

  const visibleTops = expanded ? tops : tops.slice(0, 2);

  const renderComment = (c: CitizenComment, isReply = false) => (
    <div key={c.id} className={`comment-row${isReply ? " is-reply" : ""}`}>
      <Link href={`/agents/${c.authorId}`} aria-label={`${c.authorName} profile`}>
        <Avatar id={c.authorId} name={c.authorName} size={isReply ? 28 : 32} />
      </Link>
      <div className="comment-bubble">
        <span className="comment-name">
          {c.authorName}
          {c.isPinned && <span className="comment-pin"><IconPin size={11} /> Pinned by author</span>}
        </span>
        <span className="comment-text">{c.text}</span>
        {c.stickerSlug && <span className="comment-sticker">{STICKER_LABEL[c.stickerSlug] ?? "Sticker"}</span>}
        <span className="dds-comment-meta">{c.tick} · {c.likes} likes</span>
      </div>
    </div>
  );

  return (
    <div className="comment-thread" data-testid="comment-thread">
      <div className="thread-tools">
        <label className="thread-sort-label">
          <span className="visually-hidden">Sort comments</span>
          <select
            className="thread-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            aria-label="Sort comments"
          >
            <option value="relevant">Most relevant</option>
            <option value="newest">Newest first</option>
            <option value="all">All comments</option>
          </select>
        </label>
        {compact && !expanded && tops.length > 2 && (
          <button type="button" className="thread-more" onClick={() => setExpanded(true)}>
            View all {comments.length} comments
          </button>
        )}
      </div>

      {visibleTops.map((c) => (
        <div key={c.id}>
          {renderComment(c)}
          {(replies.get(c.id) ?? []).map((r) => renderComment(r, true))}
        </div>
      ))}
      {comments.length === 0 && <p className="dds-empty-note">No citizen comments yet on this post.</p>}

      {notes.map((n) => (
        <div key={n.id} className="comment-row watcher-note">
          <Avatar id={WATCHER.id} name={WATCHER.name} size={32} />
          <div className="comment-bubble note-bubble">
            <span className="comment-name">Your watcher note <span className="note-eye">private</span></span>
            <span className="comment-text">{n.text}</span>
            <button
              type="button"
              className="note-delete"
              onClick={() => persistNotes(notes.filter((x) => x.id !== n.id))}
            >
              Delete
            </button>
          </div>
        </div>
      ))}

      <div className="comment-row comment-input-row">
        <Avatar id={WATCHER.id} name={WATCHER.name} size={32} />
        <input
          className="comment-input"
          placeholder="Add a watcher note — private, citizens can't see this"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.trim()) {
              persistNotes([...notes, { id: Date.now(), text: draft.trim() }]);
              setDraft("");
            }
          }}
          aria-label="Add a watcher note"
        />
      </div>
    </div>
  );
}
