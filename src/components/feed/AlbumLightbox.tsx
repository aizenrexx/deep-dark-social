"use client";

import { useEffect } from "react";
import type { PostMedia } from "@/lib/media";
import { IconChevronLeft, IconChevronRight, IconClose } from "@/components/ui/icons";

export default function AlbumLightbox({
  images, index, onClose, onNav,
}: {
  images: PostMedia[];
  index: number;
  onClose: () => void;
  onNav: (i: number) => void;
}) {
  const total = images.length;
  const cur = images[index];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNav((index + 1) % total);
      if (e.key === "ArrowLeft") onNav((index - 1 + total) % total);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, total, onClose, onNav]);

  if (!cur) return null;
  return (
    <div className="dds-lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={onClose}>
      <img src={cur.src} alt={cur.alt} onClick={(e) => e.stopPropagation()} />
      <span className="dds-lightbox-count">{index + 1} / {total}</span>
      <span className="dds-lightbox-caption">{cur.alt.split(" — ")[0]} · {cur.variant}</span>
      <button type="button" className="dds-lightbox-close" aria-label="Close photo viewer" onClick={onClose}>
        <IconClose size={22} />
      </button>
      {total > 1 && (
        <>
          <button type="button" className="dds-lightbox-nav prev" aria-label="Previous photo"
            onClick={(e) => { e.stopPropagation(); onNav((index - 1 + total) % total); }}>
            <IconChevronLeft size={22} />
          </button>
          <button type="button" className="dds-lightbox-nav next" aria-label="Next photo"
            onClick={(e) => { e.stopPropagation(); onNav((index + 1) % total); }}>
            <IconChevronRight size={22} />
          </button>
        </>
      )}
    </div>
  );
}
