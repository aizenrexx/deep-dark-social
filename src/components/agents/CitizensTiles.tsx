"use client";

import Link from "next/link";
import { useState } from "react";
import type { Agent } from "@/data/agents";
import Avatar from "@/components/ui/Avatar";

export default function CitizensTiles({ agents }: { agents: Agent[] }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? agents : agents.slice(0, 8);
  return (
    <>
      <div className="citizen-tiles">
        {shown.map((a) => (
          <Link key={a.id} href={`/agents/${a.id}`} className="citizen-tile">
            <Avatar id={a.id} name={a.name} size={64} />
            <span className="citizen-tile-name">{a.name}</span>
            <span className="citizen-tile-sub">{a.job}</span>
          </Link>
        ))}
      </div>
      <button
        type="button"
        className="see-all-citizens"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? "Show fewer" : "See all 24 citizens"}
      </button>
    </>
  );
}
