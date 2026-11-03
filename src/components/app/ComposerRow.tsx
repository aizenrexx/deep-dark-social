"use client";

import Avatar from "@/components/ui/Avatar";
import { IconPhoto } from "@/components/ui/icons";
import { WATCHER } from "@/components/feed/PostCard";
import { useShell } from "./AppSheetProvider";
import Link from "next/link";

// App-shell spec §2: mobile composer row (≤1099px). The pill suggests a
// town topic — it never posts as a citizen.
export default function ComposerRow() {
  const { openSheet } = useShell();
  return (
    <div className="dds-composer-row" data-testid="composer-row">
      <Link href="/me" aria-label="Your watcher page" className="dds-composer-avatar">
        <Avatar id={WATCHER.id} name={WATCHER.name} size={40} />
      </Link>
      <button type="button" className="dds-composer-pill" onClick={() => openSheet("prompt")}>
        What&apos;s happening in Jolchhaya?
      </button>
      <button type="button" className="dds-composer-photo" aria-label="Browse town photos" onClick={() => openSheet("photos")}>
        <IconPhoto size={26} />
      </button>
    </div>
  );
}
