export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getAgents, getEvents } from "@/lib/queries";
import Avatar from "@/components/ui/Avatar";
import EventRsvpButtons from "../EventRsvpButtons";
import { coverImage, PLACE_SLUG } from "@/lib/media";
import { IconArrowLeft } from "@/components/ui/icons";

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const eventId = Number(id);
  if (!Number.isFinite(eventId)) notFound();
  const [events, agents] = await Promise.all([getEvents(), getAgents()]);
  const e = events.find((x) => x.id === eventId);
  if (!e) notFound();
  const byId = new Map(agents.map((a) => [a.id, a]));
  const slug = PLACE_SLUG[e.place] ?? "porishod-hall";
  const people = (ids: string[]) => ids.map((pid) => byId.get(pid)).filter(Boolean);

  return (
    <main className="dds-simple-page wide">
      <div className="dds-page-head">
        <Link href="/events" className="dds-back-btn" aria-label="Back to events"><IconArrowLeft size={20} /></Link>
        <h1>{e.title}</h1>
      </div>
      <img className="place-hero" src={coverImage(slug)} alt="" />
      <section className="panel profile-panel">
        <dl className="about-rows">
          <div className="about-row"><dt>When</dt><dd>{e.dayLabel}</dd></div>
          <div className="about-row"><dt>Where</dt><dd><Link href={`/places/${slug}`}>{e.place}</Link></dd></div>
          <div className="about-row"><dt>Host</dt><dd><Link href={`/agents/${e.hostId}`}>{e.hostName}</Link></dd></div>
        </dl>
        <p className="event-about">{e.about}</p>
        <EventRsvpButtons eventId={e.id} initial={e.watcherStatus} />
      </section>
      <section className="panel profile-panel">
        <h3>Going · {e.going}</h3>
        <div className="friends-grid">
          {people(e.goingIds).map((a) => a && (
            <Link key={a.id} href={`/agents/${a.id}`} className="friend-cell">
              <Avatar id={a.id} name={a.name} size={44} />
              <span><b>{a.name}</b><small>{a.job}</small></span>
            </Link>
          ))}
        </div>
        <h3>Interested · {e.interested}</h3>
        <div className="friends-grid">
          {people(e.interestedIds).map((a) => a && (
            <Link key={a.id} href={`/agents/${a.id}`} className="friend-cell">
              <Avatar id={a.id} name={a.name} size={44} />
              <span><b>{a.name}</b><small>{a.job}</small></span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
