"use client";

import { useState } from "react";

async function postJson(url: string, body: unknown) {
  try {
    await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch {}
}

export default function ListingActions({
  listingId, initialVote, initialWatched,
}: {
  listingId: number;
  initialVote: string | null;
  initialWatched: boolean;
}) {
  const [vote, setVote] = useState<string | null>(initialVote);
  const [watched, setWatched] = useState(initialWatched);

  const cast = async (verdict: string) => {
    setVote(verdict);
    await postJson("/api/watcher/listing-vote", { listingId, verdict });
  };
  const toggleWatch = async () => {
    const on = !watched;
    setWatched(on);
    await postJson("/api/watcher/listing-watch", { listingId, on });
  };

  return (
    <div className="listing-actions">
      <div className="fair-vote" role="group" aria-label="Is the price fair?">
        <span>Your call — is the price fair?</span>
        {(["FAIR", "HIGH", "LOW"] as const).map((v) => (
          <button
            key={v}
            type="button"
            className={`composer-type-chip${vote === v ? " active" : ""}`}
            aria-pressed={vote === v}
            onClick={() => void cast(v)}
          >
            {v === "FAIR" ? "Fair" : v === "HIGH" ? "Too high" : "A bargain"}
          </button>
        ))}
        {vote && <small className="tab-note">Counted separately — the town sees its own tally.</small>}
      </div>
      <button type="button" className="secondary-action" onClick={toggleWatch} aria-pressed={watched}>
        {watched ? "Watching this price" : "Watch price"}
      </button>
      <button
        type="button"
        className="primary-action"
        disabled
        title="Citizens trade among themselves on market day. Kori is the town's money — the Watcher holds none."
      >
        Buy
      </button>
      <p className="profile-action-note">Buying is citizens-only: kori belongs to the town, and the Watcher holds none.</p>
    </div>
  );
}
