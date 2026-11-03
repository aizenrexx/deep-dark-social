import type { Agent } from "@/data/agents";

export default function SeasonGoalCard({ agent }: { agent: Agent }) {
  return (
    <section className="panel profile-panel">
      <h3>Season Goal</h3>
      <p className="goal-text">{agent.goal}</p>
    </section>
  );
}
