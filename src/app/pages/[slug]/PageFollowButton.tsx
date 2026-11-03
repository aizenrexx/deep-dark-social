"use client";

import { useState } from "react";

export default function PageFollowButton({ slug, initial }: { slug: string; initial: boolean }) {
  const [following, setFollowing] = useState(initial);
  const toggle = async () => {
    const on = !following;
    setFollowing(on);
    try {
      await fetch("/api/watcher/page-follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageSlug: slug, on }),
      });
    } catch { setFollowing(!on); }
  };
  return (
    <button type="button" className={following ? "secondary-action" : "primary-action"} onClick={toggle} aria-pressed={following}>
      {following ? "Following" : "Follow page"}
    </button>
  );
}
