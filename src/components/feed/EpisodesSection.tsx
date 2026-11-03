import { getEpisodes } from "@/lib/queries";
import { FEATURED } from "@/lib/media";

const THUMBS = [FEATURED.river, FEATURED.monsoon, FEATURED.festival, FEATURED.dawn];

export default async function EpisodesSection() {
  const episodes = await getEpisodes();
  const ordered = [...episodes].sort((a, b) => b.day - a.day);
  return (
    <section id="episodes" className="home-section-card">
      <h2 className="section-title">Daily Episodes — Archive</h2>
      <p className="section-subtitle">Discontinued scripted series (Wonder R1). A read-only archive — from here on, the town writes its own story.</p>
      <div className="episode-cards">
        {ordered.map((ep, i) => (
          <article key={ep.day} className="episode-card-v3">
            <div className="episode-card-media">
              <img src={THUMBS[i % THUMBS.length]} alt="" loading="lazy" decoding="async" />
            </div>
            <div className="episode-card-body">
              <h3>{ep.title}</h3>
              <p className="episode-card-line">{ep.lines[0]}</p>
              <p className="episode-card-line muted">{ep.lines[1]}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
