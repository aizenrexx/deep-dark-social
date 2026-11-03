"use client";

import { useState } from "react";

async function postJson(url: string, body: unknown) {
  try {
    await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch {}
}

export default function EventRsvpButtons({
  eventId, initial,
}: {
  eventId: number;
  initial: string | null;
}) {
  const [status, setStatus] = useState<string | null>(initial);
  const choose = async (next: string) => {
    const value = status === next ? null : next;
    setStatus(value);
    await postJson("/api/watcher/event-rsvp", { eventId, status: value });
  };
  return (
    <div className="rsvp-row" role="group" aria-label="Your response">
      <button
        type="button"
        className={`primary-action${status === "GOING" ? " active-rsvp" : ""}`}
        aria-pressed={status === "GOING"}
        onClick={() => void choose("GOING")}
      >
        {status === "GOING" ? "You're going" : "Going"}
      </button>
      <button
        type="button"
        className={`secondary-action${status === "INTERESTED" ? " active-rsvp" : ""}`}
        aria-pressed={status === "INTERESTED"}
        onClick={() => void choose("INTERESTED")}
      >
        {status === "INTERESTED" ? "You're interested" : "Interested"}
      </button>
      <small className="tab-note">You watch from the square — the town counts your name kindly.</small>
    </div>
  );
}
