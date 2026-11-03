"use client";

import { useState } from "react";
import type { PollData } from "@/lib/queries";

// Poll post body (master plan §2.1): citizens' ballots are the bars;
// the watcher votes too, tallied separately with an eye badge.
export default function PollCard({
  poll, watcherVote,
}: {
  poll: PollData;
  watcherVote: number | null;
}) {
  const [vote, setVote] = useState<number | null>(watcherVote);
  const [options, setOptions] = useState(poll.options);
  const [busy, setBusy] = useState(false);
  const total = options.reduce((a, o) => a + o.votes, 0);
  const voted = vote !== null;

  const cast = async (optionId: number) => {
    if (busy) return;
    setBusy(true);
    const prev = vote;
    setVote(optionId);
    try {
      const r = await fetch("/api/watcher/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pollId: poll.id, optionId }),
      });
      const j = await r.json();
      if (j?.options) {
        setOptions((cur) => cur.map((o) => ({ ...o, votes: j.options.find((x: { id: number; votes: number }) => x.id === o.id)?.votes ?? o.votes })));
      }
    } catch {
      setVote(prev);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="poll-card" data-testid="poll-card">
      <p className="poll-question">{poll.question}</p>
      <div className="poll-options">
        {options.map((o) => {
          const pct = total > 0 ? Math.round((o.votes / total) * 100) : 0;
          const mine = vote === o.id;
          return voted ? (
            <button
              key={o.id}
              type="button"
              className={`poll-result${mine ? " mine" : ""}`}
              onClick={() => cast(o.id)}
              aria-pressed={mine}
              title="Tap to change your vote"
            >
              <span className="poll-bar" style={{ width: `${pct}%` }} aria-hidden="true" />
              <span className="poll-result-label">{o.label}{mine ? " · Your vote" : ""}</span>
              <span className="poll-result-pct">{pct}%</span>
            </button>
          ) : (
            <button
              key={o.id}
              type="button"
              className="poll-option"
              onClick={() => cast(o.id)}
              disabled={busy}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      <p className="poll-meta">
        {total} citizen votes{voted ? " · you voted too (watcher tally, kept separate)" : ""} · Closes {poll.closesTick}
      </p>
    </div>
  );
}
