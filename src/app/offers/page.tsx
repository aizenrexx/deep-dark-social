export const dynamic = "force-dynamic";

import Link from "next/link";
import { getOffers } from "@/lib/queries";

// Town offers (Phase 4): standing kindnesses from the Pages.
export default async function OffersPage() {
  const offers = await getOffers();
  return (
    <main className="dds-simple-page wide">
      <div className="dds-page-head"><h1>Offers</h1></div>
      <p className="tab-note">Standing offers from the town's Pages — most cost nothing but a name and a thank-you.</p>
      <div className="news-list">
        {offers.map((o) => (
          <article key={o.id} className="news-card">
            <h2>{o.title}</h2>
            <p>{o.terms}</p>
            <small><Link href={`/pages/${o.byPageSlug}`}>{o.byPageName}</Link> · runs until {o.expiresTick}</small>
          </article>
        ))}
      </div>
    </main>
  );
}
