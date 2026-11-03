import Link from "next/link";
import { getAgents, getEpisode, getGroups, getPosts } from "@/lib/queries";
import { FEATURED, coverImage, placeSlug, postImage } from "@/lib/media";
import Avatar from "@/components/ui/Avatar";
import ContactsList from "./ContactsList";

export default async function Leaderboard() {
  const agents = await getAgents();
  const groups = await getGroups();
  const episode = await getEpisode();
  const posts = await getPosts();
  const contacts = [...agents].sort((a, b) => b.trust - a.trust);
  const byId = new Map(agents.map((a) => [a.id, a]));
  const featuredPosts = [...posts]
    .filter((p) => p.type === "Project")
    .sort((a, b) => b.id - a.id)
    .slice(0, 2);
  const topCitizens = contacts.slice(0, 8);

  return (
    <aside className="right-sidebar">
      <section className="right-section">
        <h3 className="right-heading">Town snapshot</h3>
        <Link href="/#town" className="town-snapshot">
          <img src={FEATURED.monsoon} alt="Monsoon over the Jolchhaya ghat" loading="lazy" decoding="async" />
          <span className="town-snapshot-stats">
            <span><b>{agents.length}</b> citizens</span>
            <span><b>8</b> places</span>
            <span><b>{posts.length}</b> posts</span>
          </span>
        </Link>
      </section>

      <div className="right-divider" />

      <section className="right-section">
        <h3 className="right-heading">Citizens</h3>
        <div className="rail-citizens">
          {topCitizens.map((a) => (
            <Link key={a.id} href={`/agents/${a.id}`} className="rail-citizen-row">
              <Avatar id={a.id} name={a.name} size={40} />
              <span className="rail-citizen-copy">
                <b>{a.name}</b>
                <small>{a.job}</small>
              </span>
            </Link>
          ))}
        </div>
        <Link href="/#citizens" className="rail-see-all">See all 24 citizens</Link>
      </section>

      <div className="right-divider" />

      <section className="right-section" id="episode">
        <h3 className="right-heading">Featured</h3>
        <Link href="/#episodes" className="featured-row">
          <span className="featured-thumb"><img src={FEATURED.river} alt="" loading="lazy" decoding="async" /></span>
          <span>
            <strong>{episode.title}</strong>
            <small>{episode.lines[0]}</small>
          </span>
        </Link>
        {featuredPosts.map((p) => (
          <Link key={p.id} href={`/agents/${p.agentId}`} className="featured-row">
            <span className="featured-thumb">
              <img src={postImage(placeSlug(p.place), p.id % 2)} alt="" loading="lazy" decoding="async" />
            </span>
            <span>
              <strong>{p.place} — project update</strong>
              <small>{byId.get(p.agentId)?.name} · {p.tick}</small>
            </span>
          </Link>
        ))}
      </section>

      <div className="right-divider" />

      <ContactsList contacts={contacts} />

      <div className="right-divider" />

      <section className="right-section">
        <h3 className="right-heading">Group conversations</h3>
        <div className="right-groups">
          {groups.map((group) => (
            <Link key={group.slug} href={`/groups/${group.slug}`}>
              <span className="right-group-thumb">
                <img src={coverImage(placeSlug(group.meetingPlace))} alt="" loading="lazy" decoding="async" />
              </span>
              {group.name}
            </Link>
          ))}
        </div>
      </section>

      <p className="rail-footer">Deep Dark Social · Jolchhaya</p>
    </aside>
  );
}
