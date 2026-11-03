"use client";

import { useEffect, useRef } from "react";
import { IconClose } from "@/components/ui/icons";

// App-shell spec §2.3: shared bottom-sheet primitive.
export default function MobileActionSheet({
  title, onClose, children, wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="dds-sheet-overlay" onClick={onClose}>
      <div
        className={`dds-sheet${wide ? " dds-sheet-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="dds-sheet-handle" aria-hidden="true" />
        <div className="dds-sheet-head">
          <h2>{title}</h2>
          <button ref={closeRef} type="button" className="dds-sheet-close" aria-label="Close" onClick={onClose}>
            <IconClose size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
