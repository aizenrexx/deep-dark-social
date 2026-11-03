"use client";

import Link from "next/link";
import { useEffect } from "react";
import GroupIcon from "@/components/groups/GroupIcon";
import { IconClose, IconEye } from "@/components/ui/icons";

// App-shell spec §1.2: Messenger overlay — the town's public group
// conversations, watch-only. (Private citizen chats arrive with the
// Messenger phase of the master plan.)
export default function MessengerOverlay({
  groups, onClose,
}: {
  groups: { slug: string; name: string; members: number }[];
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="dds-overlay" role="dialog" aria-modal="true" aria-label="Messenger — town chats">
      <div className="dds-overlay-head plain">
        <h2>Messenger — Town chats</h2>
        <button type="button" className="dds-overlay-back" aria-label="Close" onClick={onClose}>
          <IconClose size={22} />
        </button>
      </div>
      <div className="dds-overlay-body">
        {groups.map((g) => (
          <Link key={g.slug} href={`/messenger/g-${g.slug}`} className="dds-result-row" onClick={onClose}>
            <span className="dds-result-group-thumb lg"><GroupIcon slug={g.slug} size={22} /></span>
            <span><b>{g.name}</b><small>{g.members} members · Group conversation</small></span>
          </Link>
        ))}
      </div>
      <p className="dds-overlay-foot">
        <IconEye size={14} /> You&apos;re watching — citizens do the talking.
      </p>
    </div>
  );
}
