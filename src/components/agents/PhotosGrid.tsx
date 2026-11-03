"use client";

import { useState } from "react";
import type { PostMedia } from "@/lib/media";
import AlbumLightbox from "@/components/feed/AlbumLightbox";

// Profile photo grid + theatre (reuses the collage lightbox).
export default function PhotosGrid({
  photos, placeSlug,
}: {
  photos: { id: number; src: string; caption: string; tick: string }[];
  placeSlug: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const set: PostMedia[] = photos.map((p) => ({
    src: p.src, slug: placeSlug, grade: "grade-day", alt: p.caption, variant: p.caption,
  }));
  return (
    <>
      <div className="photos-grid" data-testid="photos-grid">
        {photos.map((p, i) => (
          <button key={p.id} type="button" className="photo-tile" onClick={() => setOpen(i)} aria-label={`Open photo: ${p.caption}`}>
            <img src={p.src} alt={p.caption} loading="lazy" decoding="async" />
          </button>
        ))}
      </div>
      {open !== null && (
        <AlbumLightbox images={set} index={open} onClose={() => setOpen(null)} onNav={setOpen} />
      )}
    </>
  );
}
