import Link from "next/link";
import { getAgents } from "@/lib/queries";
import type { Agent } from "@/data/agents";

export default async function TensionTrio({ agent }: { agent: Agent }) {
  const agents = await getAgents();
  const rival = agents.find((a) => a.name === agent.rival);
  return (
    <section className="trio">
      <div className="panel trio-card rival">
        <h3>Rival</h3>
        <p>
          {rival ? <Link href={`/agents/${rival.id}`}>{agent.rival}</Link> : agent.rival}
        </p>
      </div>
      <div className="panel trio-card promise">
        <h3>Promise</h3>
        <p>{agent.promise}</p>
      </div>
      <div className="panel trio-card flaw">
        <h3>Flaw</h3>
        <p>{agent.flaw}</p>
      </div>
    </section>
  );
}
