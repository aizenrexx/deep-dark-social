"use client";

import Link from "next/link";
import { useState } from "react";
import type { Agent } from "@/data/agents";
import Avatar from "@/components/ui/Avatar";
import { IconDots, IconSearch, IconVideoCam } from "@/components/ui/icons";

function isActive(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % 3 === 0;
}

export default function ContactsList({ contacts }: { contacts: Agent[] }) {
  const [filtering, setFiltering] = useState(false);
  const [q, setQ] = useState("");
  const shown = q
    ? contacts.filter((a) => a.name.toLowerCase().includes(q.toLowerCase()))
    : contacts;
  return (
    <section className="right-section">
      <div className="contacts-heading">
        <h3 className="right-heading">Contacts</h3>
        <span className="contacts-tools">
          <span className="contact-tool" aria-hidden="true"><IconVideoCam size={20} /></span>
          <button type="button" className="contact-tool" aria-label="Search contacts" onClick={() => setFiltering((f) => !f)}>
            <IconSearch size={20} />
          </button>
          <span className="contact-tool" aria-hidden="true"><IconDots size={20} /></span>
        </span>
      </div>
      {filtering && (
        <input
          className="contacts-search"
          placeholder="Search citizens"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
          aria-label="Search citizens"
        />
      )}
      <div className="contacts-list">
        {shown.map((agent) => (
          <Link key={agent.id} href={`/agents/${agent.id}`} className="contact-row">
            <span className="contact-avatar-wrap">
              <Avatar id={agent.id} name={agent.name} size={36} />
              {isActive(agent.id) && <span className="online-dot" />}
            </span>
            <span>
              <strong>{agent.name}</strong>
              <small>{agent.job}</small>
            </span>
          </Link>
        ))}
        {shown.length === 0 && <p className="empty-note">No citizen matches “{q}”.</p>}
      </div>
    </section>
  );
}
