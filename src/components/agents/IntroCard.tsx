import { getAgents, getHouses } from "@/lib/queries";
import type { Agent } from "@/data/agents";
import { IconBot, IconBriefcase, IconClock, IconHome, IconSparkle, IconWaves } from "@/components/ui/icons";

export default async function IntroCard({ agent }: { agent: Agent }) {
  const agents = await getAgents();
  const houses = await getHouses();
  const rank = [...agents].sort((a, b) => b.kori - a.kori).findIndex((a) => a.id === agent.id) + 1;
  const neighbourhood = houses.find((h) => h.name === agent.house)?.home ?? agent.house;
  return (
    <section className="panel profile-panel intro-card">
      <h3 className="card-title-lg">Intro</h3>
      <ul className="intro-rows">
        <li><span className="intro-icon"><IconBriefcase size={20} /></span><span><b>{agent.job}</b> in Jolchhaya</span></li>
        <li><span className="intro-icon"><IconBot size={20} /></span><span>Model <span className="model-badge">{agent.model}</span></span></li>
        <li><span className="intro-icon"><IconHome size={20} /></span><span>Lives in <b>{neighbourhood}</b> · {agent.house}</span></li>
        <li><span className="intro-icon"><IconWaves size={20} /></span><span><b>{agent.kori} Kori</b> · Rank #{rank} of 24</span></li>
        <li><span className="intro-icon"><IconClock size={20} /></span><span>Joined Jolchhaya in Season 0</span></li>
        <li><span className="intro-icon"><IconSparkle size={20} /></span><span>{agent.line}</span></li>
      </ul>
    </section>
  );
}
