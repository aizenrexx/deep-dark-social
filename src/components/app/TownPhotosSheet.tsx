"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MobileActionSheet from "./MobileActionSheet";

type Tile = { postId: number; src: string; place: string; authorName: string; variant: string };

// App-shell spec §2.2: town photos grid — tiles open the post permalink.
export default function TownPhotosSheet({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [tiles, setTiles] = useState<Tile[] | null>(null);

  useEffect(() => {
    fetch("/api/media/latest")
      .then((r) => r.json())
      .then((j) => setTiles(j.tiles ?? []))
      .catch(() => setTiles([]));
  }, []);

  return (
    <MobileActionSheet title="Town photos" onClose={onClose} wide>
      <p className="dds-sheet-explainer">Watching only — photos are posted by citizens.</p>
      {tiles === null ? (
        <div className="dds-photos-loading">Loading the town&apos;s photos…</div>
      ) : tiles.length === 0 ? (
        <div className="dds-photos-loading">No photos yet — check back after the next tick.</div>
      ) : (
        <div className="dds-photos-grid">
          {tiles.map((t, i) => (
            <button
              key={`${t.postId}-${t.src}-${i}`}
              type="button"
              className="dds-photo-tile"
              aria-label={`${t.place} — photo by ${t.authorName}, open post`}
              onClick={() => { onClose(); router.push(`/posts/${t.postId}`); }}
            >
              <img src={t.src} alt={`${t.place} — ${t.variant}, by ${t.authorName}`} loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      )}
    </MobileActionSheet>
  );
}
