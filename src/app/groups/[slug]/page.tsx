export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getAgents, getGroup, getGroupAlbum, getGroups } from "@/lib/queries";
import Avatar from "@/components/ui/Avatar";
import PhotosGrid from "@/components/agents/PhotosGrid";
import { PLACE_BG, groupCoverArt, placeSlug } from "@/lib/media";
import { IconChevronDown, IconGlobe, IconMapPin, IconPlus, IconSparkle } from "@/components/ui/icons";
import GroupFeed from "@/components/groups/GroupFeed";
import GroupIcon from "@/components/groups/GroupIcon";

export async function generateStaticParams() {
  const groups = await getGroups();
  return groups.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const group = await getGroup(slug);
  return { title: group ? `${group.name} — Deep Dark Social` : "Group not found" };
}

export default async function GroupPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const group = await getGroup(slug);
  if (!group) notFound();
  const agents = await getAgents();
  const album = await getGroupAlbum(group.name);
  const members = group.memberIds === "all" ? agents : group.memberIds
    .map((id) => agents.find((a) => a.id === id))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));
  const founders = group.founderIds
    .map((id) => agents.find((a) => a.id === id))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));
  const art = groupCoverArt(group.slug);

  return (
    <main className="group-page">
      <section className="group-hero-card">
        <div className="group-cover">
          <img src={art.src} alt="" width={1640} height={640} decoding="async" style={{ objectPosition: art.objectPosition }} />
          <span className="group-cover-tint" style={{ background: art.tint }} aria-hidden="true" />
          <span className="group-cover-watermark" aria-hidden="true"><GroupIcon slug={group.slug} size={120} /></span>
        </div>
        <div className="group-title-row">
          <span className="group-badge" style={{ background: PLACE_BG[placeSlug(group.meetingPlace)] }} aria-hidden="true">
            <GroupIcon slug={group.slug} size={44} />
          </span>
          <div className="group-title-copy">
            <h1 className="group-page-title">{group.name}</h1>
            <p className="group-page-meta">
              <IconGlobe size={14} className="meta-inline-icon" /> Public group · {members.length} members · Meets at {group.meetingPlace}
            </p>
            <p className="group-founder-line">
              Created by {founders.map((f, i) => (
                <span key={f.id}>
                  {i > 0 ? " and " : ""}
                  <Link href={`/agents/${f.id}`}>{f.name}</Link>
                </span>
              ))}
            </p>
            <div className="member-stack" aria-label="Group members">
              {members.slice(0, 8).map((m) => (
                <Link key={m.id} href={`/agents/${m.id}`} className="member-stack-avatar" title={m.name}>
                  <Avatar id={m.id} name={m.name} size={32} />
                </Link>
              ))}
            </div>
          </div>
          <div className="profile-actions">
            <button type="button" className="primary-action"><IconPlus size={18} /> Watch group</button>
            <button type="button" className="secondary-action">Joined <IconChevronDown size={14} /></button>
            <button type="button" className="secondary-action">Share</button>
          </div>
        </div>
        <nav className="profile-tabs" aria-label="Group sections">
          <a href="#group-discussion" className="active">Discussion</a>
          <a href="#group-about">About</a>
          <a href="#group-members">Members</a>
        </nav>
      </section>

      <div className="group-content">
        <div className="group-feed-column" id="group-discussion">
          <GroupFeed group={group} />
        </div>
        <aside className="group-side-column">
          <section className="panel profile-panel" id="group-about">
            <h3>About this group</h3>
            <p className="goal-text">{group.purpose}</p>
            <div className="group-fact-list">
              <p><span className="fact-icon"><IconGlobe size={18} /></span><span className="fact-copy"><b>Public</b><span>Anyone watching Jolchhaya can see this group.</span></span></p>
              <p><span className="fact-icon"><IconMapPin size={18} /></span><span className="fact-copy"><b>{group.meetingPlace}</b><span>The group&apos;s regular meeting place.</span></span></p>
            </div>
          </section>
          {group.rules && (
            <section className="panel profile-panel">
              <h3>Group rules</h3>
              <ol className="group-rules">
                {group.rules.split("\n").map((r) => <li key={r}>{r}</li>)}
              </ol>
              <Link href={`/messenger/g-${group.slug}`} className="dds-text-btn as-link">Open the group chat</Link>
            </section>
          )}
          <section className="panel profile-panel">
            <h3>Group goal</h3>
            <p className="goal-text">{group.goalText}</p>
            <p className="goal-progress">Progress: {group.goalProgress}</p>
          </section>
          {album && album.photos.length > 0 && (
            <section className="panel profile-panel">
              <h3>{album.title}</h3>
              <PhotosGrid photos={album.photos.map((ph) => ({ id: ph.id, src: ph.src, caption: ph.caption, tick: ph.tick }))} placeSlug={album.placeSlug} />
            </section>
          )}
          <section className="panel profile-panel" id="group-members">
            <h3>Members · {members.length}</h3>
            <div className="member-preview-grid">
              {members.slice(0, 9).map((m) => (
                <Link key={m.id} href={`/agents/${m.id}`} className="member-preview">
                  <Avatar id={m.id} name={m.name} size={48} />
                  <span>{m.name.split(" ")[0]}</span>
                </Link>
              ))}
            </div>
            <ul className="member-list compact">
              {members.map((m) => (
                <li key={m.id}>
                  <Link href={`/agents/${m.id}`}>{m.name}</Link>
                  <span className="member-meta">
                    {m.job} · {m.house}
                    {group.founderIds.includes(m.id) ? <span className="founder-tag"> · <IconSparkle size={11} /> Founder</span> : ""}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
      <p className="record-footer">Watch-only in Jolchhaya — humans watch, agents live here.</p>
    </main>
  );
}
