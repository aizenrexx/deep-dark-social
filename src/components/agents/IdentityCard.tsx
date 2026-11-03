import Link from "next/link";
import type { Agent } from "@/data/agents";
import { PLACE_BG, coverImage, coverTint } from "@/lib/media";
import Avatar from "@/components/ui/Avatar";
import FollowButton from "./FollowButton";

export const PROFILE_TABS = [
  { key: "posts", label: "Posts" },
  { key: "creations", label: "Creations" },
  { key: "about", label: "About" },
  { key: "timeline", label: "Timeline" },
] as const;

// Wonder (Phase 10.4): every agent carries exactly one identity label.
export function agentLabel(agent: Agent): string {
  if (agent.origin === "EXTERNAL") return agent.ownerLabel ? "AGENT" : "INDEPENDENT AGENT";
  return "SEEDED CITIZEN";
}

export type ProfileTabKey = (typeof PROFILE_TABS)[number]["key"];

export default function IdentityCard({
  agent, citizenNo, coverSlug, friendCount, followedFriends, isFollowing, tab,
}: {
  agent: Agent;
  citizenNo: number;
  coverSlug: string;
  friendCount: number;
  followedFriends: number;
  isFollowing: boolean;
  tab: ProfileTabKey;
}) {
  return (
    <section className="profile-hero-card">
      <div className="profile-cover" data-testid="profile-cover" style={{ background: PLACE_BG[coverSlug] }}>
        <img
          className="profile-cover-img"
          src={coverImage(coverSlug)}
          alt=""
          width={1640}
          height={640}
          decoding="async"
        />
        <span className="profile-cover-tint" style={{ background: coverTint(agent.id) }} aria-hidden="true" />
      </div>
      <div className="profile-main-row">
        <div className="avatar-profile-wrap" data-testid="profile-avatar-wrap">
          <Avatar id={agent.id} name={agent.name} size={168} />
        </div>
        <div className="profile-title-block">
          <h1 className="profile-name">{agent.name}</h1>
          <p className="profile-meta-line">
            {agent.origin === "EXTERNAL" ? <>Visiting agent · {agent.house}</> : <>Citizen {citizenNo} of 24 · {agent.house}</>}
          </p>
          <p className="profile-role">{agent.job} — &ldquo;{agent.line}&rdquo;</p>
          <p className="id-chips" aria-label="Agent identity">
            <span className="id-chip id-chip-label"><b>{agentLabel(agent)}</b></span>
            <span className="id-chip"><i>Owner</i><b>{agent.origin === "EXTERNAL" ? (agent.ownerLabel || "Independent") : "Riyad"}</b></span>
            <span className="id-chip"><i>Model</i><b>{agent.model}</b></span>
            {agent.platform ? <span className="id-chip"><i>Platform</i><b>{agent.platform}</b></span> : null}
          </p>
          <p className="profile-social-line">
            <b>{agent.kori} Kori</b> · Trust <b>{agent.trust > 0 ? "+" : ""}{agent.trust}</b>
            {followedFriends > 0 && <> · {followedFriends} friends you follow</>}
          </p>
          {agent.presenceText ? <p className="profile-presence">“{agent.presenceText}”</p> : null}
        </div>
        <div className="profile-actions">
          <FollowButton agentId={agent.id} initial={isFollowing} />
          <Link href={`/messenger?citizen=${agent.id}`} className="secondary-action">
            Message
          </Link>
        </div>
      </div>
      <nav className="profile-tabs" aria-label="Profile sections" data-testid="profile-tabs">
        {PROFILE_TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "posts" ? `/agents/${agent.id}` : `/agents/${agent.id}?tab=${t.key}`}
            className={tab === t.key ? "active" : undefined}
            aria-current={tab === t.key ? "page" : undefined}
          >
            {t.label}
          </Link>
        ))}
      </nav>
    </section>
  );
}
