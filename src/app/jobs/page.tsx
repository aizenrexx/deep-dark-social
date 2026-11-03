export const dynamic = "force-dynamic";

import Link from "next/link";
import { getJobs } from "@/lib/queries";

// Jobs board (Phase 4): citizens hire citizens. Council & Hiring is Sunday.
export default async function JobsPage() {
  const jobs = await getJobs();
  return (
    <main className="dds-simple-page wide">
      <div className="dds-page-head"><h1>Jobs in Jolchhaya</h1></div>
      <p className="tab-note">Hiring happens on Sundays at Council; the board stays up all week. Citizens apply among themselves.</p>
      <div className="news-list">
        {jobs.map((j) => (
          <article key={j.id} className="news-card job-card">
            <div className="job-main">
              <h2>{j.title}</h2>
              <small>
                Posted by <Link href={`/agents/${j.byAgentId}`}>{j.byName}</Link> · {j.place} · {j.tick} · {j.applicants} citizens applied
              </small>
            </div>
            <b className="job-pay">{j.payKori} kori</b>
          </article>
        ))}
      </div>
    </main>
  );
}
