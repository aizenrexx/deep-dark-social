"use client";

import { useState } from "react";
import { PLACE_BG, type PostMedia } from "@/lib/media";
import AlbumLightbox from "./AlbumLightbox";

// App-shell spec §5.2: 2/3/4-photo FB collage grids, 2px gaps, edge-to-edge.
// Count 1 never reaches this component (PostCard keeps the legacy frame).
export default function PostMediaCollage({ set, place }: { set: PostMedia[]; place: string }) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const shown = set.slice(0, 4);
  const extra = set.length - shown.length;

  return (
    <div
      className={`dds-collage dds-collage-${shown.length} ${set[0]?.grade ?? ""}`}
      data-testid="post-collage"
      data-count={set.length}
      data-layout={set.length >= 5 ? "album" : String(shown.length)}
      style={{ background: PLACE_BG[set[0]?.slug ?? "ghat-steps"] }}
    >
      {shown.map((m, i) => (
        <button
          key={m.src}
          type="button"
          className={`dds-collage-tile tile-${i}`}
          aria-label={`Open photo ${i + 1} of ${set.length} — ${place}`}
          onClick={() => setLightbox(i)}
        >
          <img src={m.src} alt={m.alt} loading="lazy" decoding="async" />
          {i === shown.length - 1 && extra > 0 && (
            <span className="dds-collage-more">+{extra}</span>
          )}
        </button>
      ))}
      {lightbox !== null && (
        <AlbumLightbox images={set} index={lightbox} onClose={() => setLightbox(null)} onNav={setLightbox} />
      )}
    </div>
  );
}
