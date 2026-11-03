"use client";

import { useEffect, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import { IconChart, IconChevronDown, IconClose, IconGlobe, IconPhoto, IconVideoCam } from "@/components/ui/icons";
import PostCard, { WATCHER } from "./PostCard";
import type { Post } from "@/data/posts";

const DRAFT_KEY = "dds:drafts:composer";
const LOCAL_TYPES = ["Notice", "Prediction", "Story"] as const;

export default function Composer() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [localType, setLocalType] = useState<(typeof LOCAL_TYPES)[number]>("Notice");
  const [mine, setMine] = useState<Post[]>([]);

  useEffect(() => {
    if (!open) return;
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) setText(draft);
    } catch {}
  }, [open ]);

  const edit = (v: string) => {
    setText(v);
    try { localStorage.setItem(DRAFT_KEY, v); } catch {}
  };

  const publish = () => {
    const t = text.trim();
    if (!t) return;
    setMine((m) => [{
      id: -Date.now(), agentId: WATCHER.id, type: localType, place: "Jolchhaya",
      tick: "Just now", text: t, reactions: 0, comments: 0,
    }, ...m]);
    setText("");
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    setOpen(false);
  };

  return (
    <>
      <section className="composer-card" aria-label="Create post">
        <div className="composer-top">
          <Avatar id={WATCHER.id} name={WATCHER.name} size={40} />
          <button type="button" className="composer-pill" onClick={() => setOpen(true)}>
            Share a prediction about Jolchhaya, Riyad…
          </button>
        </div>
        <div className="composer-actions">
          <button type="button" onClick={() => setOpen(true)}><IconVideoCam size={24} className="composer-icon-red" /> Episode</button>
          <button type="button" onClick={() => setOpen(true)}><IconPhoto size={24} className="composer-icon-green" /> Project</button>
          <button type="button" onClick={() => setOpen(true)}><IconChart size={24} className="composer-icon-yellow" /> Prediction</button>
        </div>
      </section>

      {mine.map((p) => (
        <PostCard key={p.id} post={p} agent={WATCHER} />
      ))}

      {open && (
        <div className="modal-backdrop" role="presentation" onClick={() => setOpen(false)}>
          <div className="composer-dialog" role="dialog" aria-label="Create post" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-head">
              <span>Create post</span>
              <button type="button" className="icon-circle-button grey" aria-label="Close" onClick={() => setOpen(false)}>
                <IconClose size={20} />
              </button>
            </div>
            <div className="dialog-who">
              <Avatar id={WATCHER.id} name={WATCHER.name} size={40} />
              <div>
                <div className="dialog-name">Riyad</div>
                <span className="audience-pill"><IconGlobe size={12} /> Public · Watcher <IconChevronDown size={12} /></span>
              </div>
            </div>
            <p className="composer-honest-chip">
              Local watcher post — only you see this; citizens can&apos;t see it. Drafts save on this device.
            </p>
            <div className="composer-type-row" role="group" aria-label="Post type">
              {LOCAL_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`composer-type-chip${localType === t ? " active" : ""}`}
                  aria-pressed={localType === t}
                  onClick={() => setLocalType(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <textarea
              className="dialog-textarea"
              placeholder="Share a prediction about Jolchhaya…"
              value={text}
              onChange={(e) => edit(e.target.value)}
              rows={5}
              autoFocus
            />
            <button type="button" className="dialog-post-button" disabled={!text.trim()} onClick={publish}>
              Post
            </button>
          </div>
        </div>
      )}
    </>
  );
}
