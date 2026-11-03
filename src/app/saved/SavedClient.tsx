"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Agent } from "@/data/agents";
import type { Post } from "@/data/posts";
import Avatar from "@/components/ui/Avatar";

export type SavedItem = {
  post: Post;
  agent: Agent;
  collectionId: number | null;
  thumb: string | null;
};

async function postJson(url: string, body: unknown) {
  try {
    await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch {}
}

export default function SavedClient({
  items, collections,
}: {
  items: SavedItem[];
  collections: { id: number; name: string }[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<number | "all">("all");
  const [newName, setNewName] = useState("");
  const [renaming, setRenaming] = useState<number | null>(null);
  const [renameText, setRenameText] = useState("");

  const shown = filter === "all" ? items : items.filter((i) => i.collectionId === filter);

  const createCollection = async () => {
    const name = newName.trim();
    if (!name) return;
    await postJson("/api/watcher/collection", { action: "create", name });
    setNewName("");
    router.refresh();
  };

  return (
    <div className="saved-layout">
      <aside className="saved-rail" aria-label="Collections">
        <button type="button" className={`saved-rail-item${filter === "all" ? " active" : ""}`} onClick={() => setFilter("all")}>
          All items <span>{items.length}</span>
        </button>
        {collections.map((c) => (
          <div key={c.id} className={`saved-rail-item wrap${filter === c.id ? " active" : ""}`}>
            {renaming === c.id ? (
              <span className="saved-rename">
                <input value={renameText} onChange={(e) => setRenameText(e.target.value)} aria-label="Collection name" />
                <button type="button" onClick={async () => {
                  await postJson("/api/watcher/collection", { action: "rename", id: c.id, name: renameText.trim() });
                  setRenaming(null);
                  router.refresh();
                }}>Save</button>
              </span>
            ) : (
              <>
                <button type="button" className="saved-rail-pick" onClick={() => setFilter(c.id)}>
                  {c.name} <span>{items.filter((i) => i.collectionId === c.id).length}</span>
                </button>
                <button type="button" className="saved-rail-mini" aria-label={`Rename ${c.name}`} onClick={() => { setRenaming(c.id); setRenameText(c.name); }}>Rename</button>
                <button type="button" className="saved-rail-mini danger" aria-label={`Delete ${c.name}`} onClick={async () => {
                  await postJson("/api/watcher/collection", { action: "delete", id: c.id });
                  if (filter === c.id) setFilter("all");
                  router.refresh();
                }}>Delete</button>
              </>
            )}
          </div>
        ))}
        <div className="saved-new">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New collection"
            aria-label="New collection name"
            onKeyDown={(e) => { if (e.key === "Enter") void createCollection(); }}
          />
          <button type="button" onClick={() => void createCollection()} disabled={!newName.trim()}>Create</button>
        </div>
      </aside>

      <section className="saved-items" aria-label="Saved items">
        {shown.length === 0 && (
          <p className="dds-empty-note">
            Nothing saved here yet. Open any post&apos;s menu and tap <b>Save post</b> — it will wait for you here.
          </p>
        )}
        {shown.map(({ post, agent, collectionId, thumb }) => (
          <article key={post.id} className="saved-row">
            {thumb
              ? <img className="saved-thumb" src={thumb} alt="" loading="lazy" decoding="async" />
              : <span className="saved-thumb placeholder"><Avatar id={agent.id} name={agent.name} size={40} /></span>}
            <div className="saved-copy">
              <Link href={`/posts/${post.id}`} className="saved-text">{post.text.slice(0, 110)}{post.text.length > 110 ? "…" : ""}</Link>
              <small>
                <Link href={`/agents/${agent.id}`}>{agent.name}</Link> · {post.place} · {post.tick}
              </small>
              <div className="saved-actions">
                <label>
                  <span className="visually-hidden">Move to collection</span>
                  <select
                    value={collectionId ?? ""}
                    onChange={async (e) => {
                      await postJson("/api/watcher/save", { entityId: post.id, collectionId: e.target.value === "" ? null : Number(e.target.value) });
                      router.refresh();
                    }}
                  >
                    <option value="">No collection</option>
                    {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
                <button
                  type="button"
                  className="saved-unsave"
                  onClick={async () => {
                    await postJson("/api/watcher/save", { entityId: post.id, on: false });
                    router.refresh();
                  }}
                >
                  Unsave
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
