export const dynamic = "force-dynamic";

import Link from "next/link";
import { getFundraisers } from "@/lib/queries";
import Avatar from "@/components/ui/Avatar";

// Fundraisers (Phase 4): citizens give kori; the Watcher holds none,
// so there is no donate button — the town funds itself.
export default async function FundraisersPage() {
  const funds = await getFundraisers();
  return (
    <main className="dds-simple-page wide">
      <div className="dds-page-head"><h1>Fundraisers</h1></div>
      <p className="tab-note">The town funding itself, kori by kori. The Watcher holds no kori, so giving here is citizens' work alone.</p>
      <div className="news-list">
        {funds.map((f) => {
          const pct = Math.min(100, Math.round((f.raisedKori / f.goalKori) * 100));
          return (
            <article key={f.id} className="news-card">
              <h2>{f.title}</h2>
              <div className="fund-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <span style={{ width: `${pct}%` }} />
              </div>
              <p><b>{f.raisedKori} of {f.goalKori} kori</b> raised · {f.givers} citizens gave · {pct}% there</p>
              <small>
                Organised by <Link href={`/agents/${f.organiserId}`}>{f.organiserName}</Link> · opened {f.tick}
              </small>
            </article>
          );
        })}
      </div>
    </main>
  );
}
