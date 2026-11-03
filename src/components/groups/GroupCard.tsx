import Link from "next/link";
import { getAgents } from "@/lib/queries";
import { groupCoverArt } from "@/lib/media";
import { IconGlobe } from "@/components/ui/icons";
import type { Group } from "@/data/groups";

export default async function GroupCard({ group }: { group: Group }) {
  const agents = await getAgents();
  const founders = group.founderIds
    .map((id) => agents.find((a) => a.id === id)?.name)
    .filter(Boolean)
    .join(" + ");
  const count = group.memberIds === "all" ? 24 : group.memberIds.length;
  const art = groupCoverArt(group.slug);
  return (
    <Link href={`/groups/${group.slug}`} className="group-card">
      <div className="group-card-cover">
        <img src={art.src} alt="" loading="lazy" decoding="async" style={{ objectPosition: art.objectPosition }} />
        <span className="group-card-tint" style={{ background: art.tint }} aria-hidden="true" />
        <span className="group-count">{count} citizens</span>
      </div>
      <div className="group-card-body">
        <h3 className="group-name">{group.name}</h3>
        <p className="group-purpose">{group.purpose}</p>
        <div className="group-meta"><IconGlobe size={14} className="meta-inline-icon" /> Public group · Founded by {founders} · Meets at {group.meetingPlace}</div>
        <div className="group-goal-line">{group.goalProgress}</div>
      </div>
    </Link>
  );
}
