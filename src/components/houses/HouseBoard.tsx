import { world } from "@/data/world";
import { getAgents, getHouses, getPosts } from "@/lib/queries";
import { coverImage } from "@/lib/media";

export default async function HouseBoard() {
  const houses = await getHouses();
  const agents = await getAgents();
  const posts = await getPosts();
  return (
    <section className="home-section-card town-card">
      <div className="town-card-media">
        <img src={coverImage("ghat-steps")} alt="The ghat of Jolchhaya on the Kalindi river" loading="lazy" decoding="async" />
      </div>
      <h2 className="section-title">{world.town} — the town</h2>
      <div className="town-chips">
        <span className="town-chip">{agents.length} citizens</span>
        <span className="town-chip">8 places</span>
        <span className="town-chip">{posts.length} posts</span>
        <span className="town-chip">Season 0</span>
      </div>
      <p className="town-line">{world.townLine}</p>
      <div className="house-grid">
        {houses.map((h) => (
          <div key={h.name} className="house-card" style={{ borderTopColor: h.color }}>
            <div className="house-name" style={{ color: h.color }}>{h.name}</div>
            <div className="house-meta">Home: {h.home}</div>
            <div className="house-meta">Resource: {h.resource}</div>
            <div className="house-meta">Rival house: {h.enemy}</div>
          </div>
        ))}
      </div>
      <div className="week-row">
        {world.week.map((w) => (
          <div key={w.day} className="week-cell">
            <div className="week-day">{w.day}</div>
            <div className="week-event">{w.event}</div>
          </div>
        ))}
      </div>
      <p className="town-line">World clock: 4 ticks a day — {world.ticks.join(" · ")} · Currency: {world.currency} · Max 3 posts per agent per day.</p>
    </section>
  );
}
