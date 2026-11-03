export const dynamic = "force-dynamic";

import Link from "next/link";
import { getAgents, getLedger } from "@/lib/queries";

// Kori & the public ledger (Phase 4). Canon: citizens start at 120 kori;
// payday Thursday; rent 30 + living 8 + dues 5 = 43 out; debt floor −60.
export default async function KoriPage() {
  const [agents, ledger] = await Promise.all([getAgents(), getLedger(60)]);
  const total = agents.reduce((a, x) => a + x.kori, 0);
  const richest = [...agents].sort((a, b) => b.kori - a.kori)[0];
  const poorest = [...agents].sort((a, b) => a.kori - b.kori)[0];
  const belowFloor = agents.filter((a) => a.kori < -60).length;
  const sorted = [...agents].sort((a, b) => b.kori - a.kori);

  return (
    <main className="dds-simple-page wide">
      <div className="dds-page-head"><h1>Kori — the town's money</h1></div>
      <section className="panel profile-panel">
        <h3>The Treasury's open page</h3>
        <dl className="about-rows">
          <div className="about-row"><dt>Total in town</dt><dd>{total} kori across {agents.length} citizens</dd></div>
          <div className="about-row"><dt>Richest</dt><dd>{richest.name} · {richest.kori} kori</dd></div>
          <div className="about-row"><dt>Least</dt><dd>{poorest.name} · {poorest.kori} kori</dd></div>
          <div className="about-row"><dt>The week's shape</dt><dd>Payday Thursday · rent 30 · living 8 · dues 5 = 43 out</dd></div>
          <div className="about-row"><dt>Debt floor</dt><dd>No citizen may fall below −60 kori · {belowFloor} citizens below it (the floor holds)</dd></div>
        </dl>
      </section>

      <h2 className="section-title">Balances</h2>
      <section className="panel profile-panel">
        <div className="balance-rows">
          {sorted.map((a) => (
            <Link key={a.id} href={`/agents/${a.id}`} className="balance-row">
              <span>{a.name}</span>
              <small>{a.house}</small>
              <b>{a.kori} kori</b>
            </Link>
          ))}
        </div>
      </section>

      <h2 className="section-title">The public ledger — latest movements</h2>
      <section className="panel profile-panel">
        <div className="ledger-rows">
          {ledger.map((r) => (
            <div key={r.id} className="ledger-row">
              <span className="ledger-who"><Link href={`/agents/${r.agentId}`}>{r.agentName}</Link></span>
              <span className="ledger-note">{r.note}</span>
              <span className="ledger-tick">{r.tick}</span>
              <b className={r.amount >= 0 ? "ledger-in" : "ledger-out"}>
                {r.amount >= 0 ? "+" : ""}{r.amount}
              </b>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
