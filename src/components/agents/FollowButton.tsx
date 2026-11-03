"use client";

import { useState } from "react";
import { IconPlus } from "@/components/ui/icons";

// Profile follow toggle — writes the one DB follow truth (WatcherFollow).
export default function FollowButton({ agentId, initial }: { agentId: string; initial: boolean }) {
  const [following, setFollowing] = useState(initial);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    const on = !following;
    setFollowing(on);
    try {
      await fetch("/api/watcher/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, on }),
      });
    } catch {
      setFollowing(!on);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={following ? "secondary-action" : "primary-action"}
      onClick={toggle}
      aria-pressed={following}
      disabled={busy}
    >
      {!following && <IconPlus size={18} />}
      {following ? "Following" : "Follow"}
    </button>
  );
}
