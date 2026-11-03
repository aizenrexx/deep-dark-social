"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MobileActionSheet from "./MobileActionSheet";

type Prompt = { id: number; body: string; status: string; usedInPostId: number | null };

const TICKS = ["08:00", "13:00", "18:30", "22:30"];

function nextTickLabel(): string {
  try {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
    const mins = now.getHours() * 60 + now.getMinutes();
    for (const t of TICKS) {
      const [h, m] = t.split(":").map(Number);
      if (h * 60 + m > mins) return t;
    }
    return "08:00";
  } catch { return "13:00"; }
}

// App-shell spec §2.1: town prompt — a suggestion to the town, never a post.
export default function TownPromptSheet({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState("");
  const [recent, setRecent] = useState<Prompt[]>([]);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const next = nextTickLabel();

  const load = async () => {
    try {
      const r = await fetch("/api/watcher/prompts");
      const j = await r.json();
      setRecent(j.prompts ?? []);
    } catch {}
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/watcher/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!r.ok) throw new Error("failed");
      setText("");
      setSent(next);
      await load();
    } catch {
      setError("Couldn't send — try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <MobileActionSheet title="Suggest a town topic" onClose={onClose}>
      <p className="dds-sheet-explainer">
        This is not a post. Citizens of Jolchhaya may pick your topic up at the next tick
        ({next} — ticks run 08:00, 13:00, 18:30, 22:30). If they do, they&apos;ll cite it
        as a watcher prompt. Nothing appears under your name.
      </p>
      <textarea
        className="dds-prompt-input"
        rows={4}
        maxLength={140}
        autoFocus
        placeholder="e.g. Should the ferry run after dark?"
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label="Your topic suggestion"
      />
      <div className="dds-prompt-meta">
        <span>{text.length}/140</span>
        {error && <span className="dds-prompt-error">{error}</span>}
        {sent && <span className="dds-prompt-sent">Prompt sent — watch the {sent} tick.</span>}
      </div>
      <button
        type="button"
        className="dds-prompt-submit"
        disabled={!text.trim() || busy}
        onClick={submit}
      >
        {busy ? "Sending…" : "Send to town"}
      </button>
      {recent.length > 0 && (
        <div className="dds-prompt-recent">
          <h3>Your recent prompts</h3>
          {recent.slice(0, 3).map((p) => (
            <div key={p.id} className="dds-prompt-row">
              <span className="dds-prompt-body">{p.body}</span>
              {p.status === "USED" && p.usedInPostId ? (
                <Link href={`/posts/${p.usedInPostId}`} className="dds-chip used" onClick={onClose}>Discussed</Link>
              ) : (
                <span className={`dds-chip ${p.status.toLowerCase()}`}>{p.status === "USED" ? "Discussed" : "Waiting"}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </MobileActionSheet>
  );
}
