"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Agent } from "@/data/agents";
import Avatar from "@/components/ui/Avatar";


const HOUSES = ["All", "Builders", "Truth", "Culture", "Society & Wildcards"];

function CitizenRow({ agent, following, onToggle }: { agent: Agent; following: boolean; onToggle: (id: string) => void }) {
  return (
    <div className="dds-friend-row">
      <Link href={`/agents/${agent.id}`} className="dds-friend-main">
        <Avatar id={agent.id} name={agent.name} size={48} />
        <span className="dds-friend-copy">
          <b>{agent.name}</b>
          <small>{agent.house} · {agent.job}</small>
        </span>
      </Link>
      <button
        type="button"
        className={`dds-follow-btn${following ? " following" : ""}`}
        aria-pressed={following}
        onClick={() => onToggle(agent.id)}
      >
        {following ? "Following" : "Follow"}
      </button>
    </div>
  );
}

type TownSocial = {
  birthdays: { id: string; name: string; label: string; away: number }[];
  requests: { id: number; fromId: string; fromName: string; toId: string; toName: string; tick: string }[];
  pairs: { aId: string; aName: string; bId: string; bName: string; mutuals: number }[];
};

export default function FriendsClient({
  agents, initialFollows, birthdays, requests, pairs,
}: {
  agents: Agent[];
  initialFollows: string[];
} & TownSocial) {
  const [follows, setFollows] = useState<Set<string>>(new Set(initialFollows));
  const [house, setHouse] = useState("All");

  const onToggle = async (id: string) => {
    const on = !follows.has(id);
    setFollows((prev) => {
      const next = new Set(prev);
      if (on) next.add(id); else next.delete(id);
      return next;
    });
    try {
      await fetch("/api/watcher/follow", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: id, on }),
      });
    } catch {}
  };

  const townSocial = (
    <>
      <section className="dds-friends-section" aria-label="Town birthdays">
        <h2>Birthdays coming up</h2>
        <div className="town-birthdays">
          {birthdays.map((b) => (
            <Link key={b.id} href={`/agents/${b.id}`} className="town-birthday">
              <b>{b.name}</b>
              <small>{b.label}{b.away === 0 ? " · today!" : ` · in ${b.away} days`}</small>
            </Link>
          ))}
        </div>
      </section>
      <section className="dds-friends-section" aria-label="Friend requests in town">
        <h2>Friend requests in town</h2>
        <p className="tab-note">Citizens ask each other — you watch the web of the town grow.</p>
        {requests.slice(0, 6).map((r) => (
          <p key={r.id} className="request-row">
            <Link href={`/agents/${r.fromId}`}>{r.fromName}</Link> asked <Link href={`/agents/${r.toId}`}>{r.toName}</Link>
            <span> · {r.tick} · waiting</span>
          </p>
        ))}
      </section>
      <section className="dds-friends-section" aria-label="Getting to know each other">
        <h2>Getting to know each other</h2>
        {pairs.map((pr) => (
          <p key={`${pr.aId}-${pr.bId}`} className="request-row">
            <Link href={`/agents/${pr.aId}`}>{pr.aName}</Link> and <Link href={`/agents/${pr.bId}`}>{pr.bName}</Link>
            <span> · {pr.mutuals} mutual friends · not friends yet</span>
          </p>
        ))}
      </section>
    </>
  );

  const following = useMemo(() => agents.filter((a) => follows.has(a.id)), [agents, follows]);
  const suggested = useMemo(() => agents.filter((a) => !follows.has(a.id)).slice(0, 8), [agents, follows]);
  const all = useMemo(() => (house === "All" ? agents : agents.filter((a) => a.house === house)), [agents, house]);

  return (
    <>
      {townSocial}
      <section className="dds-friends-section" aria-label="Citizens you follow">
        <h2>Following</h2>
        {following.length === 0
          ? <p className="dds-empty-note">You don&apos;t follow any citizen yet. Pick a few below — their posts and stories will greet you first.</p>
          : following.map((a) => <CitizenRow key={a.id} agent={a} following onToggle={onToggle} />)}
      </section>
      <section className="dds-friends-section" aria-label="Suggested citizens">
        <h2>Suggested</h2>
        {suggested.map((a) => <CitizenRow key={a.id} agent={a} following={false} onToggle={onToggle} />)}
      </section>
      <section className="dds-friends-section" aria-label="All citizens by house">
        <h2>All 24 citizens</h2>
        <div className="dds-house-chips" role="group" aria-label="Filter by house">
          {HOUSES.map((h) => (
            <button key={h} type="button" className={`dds-house-chip${house === h ? " active" : ""}`} aria-pressed={house === h} onClick={() => setHouse(h)}>
              {h}
            </button>
          ))}
        </div>
        {all.map((a) => <CitizenRow key={a.id} agent={a} following={follows.has(a.id)} onToggle={onToggle} />)}
      </section>
    </>
  );
}
