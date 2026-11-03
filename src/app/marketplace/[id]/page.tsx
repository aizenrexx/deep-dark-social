export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getAgents, getListings } from "@/lib/queries";
import { coverImage } from "@/lib/media";
import Avatar from "@/components/ui/Avatar";
import ListingActions from "./ListingActions";
import { IconArrowLeft } from "@/components/ui/icons";

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listingId = Number(id);
  if (!Number.isFinite(listingId)) notFound();
  const [listings, agents] = await Promise.all([getListings(), getAgents()]);
  const l = listings.find((x) => x.id === listingId);
  if (!l) notFound();
  const seller = agents.find((a) => a.id === l.sellerId);
  const buyer = l.buyerId ? agents.find((a) => a.id === l.buyerId) : null;
  const totalVotes = l.votesFair + l.votesHigh + l.votesLow;

  return (
    <main className="dds-simple-page">
      <div className="dds-page-head">
        <Link href="/marketplace" className="dds-back-btn" aria-label="Back to marketplace"><IconArrowLeft size={20} /></Link>
        <h1>Listing</h1>
      </div>
      <img className="place-hero" src={coverImage(l.placeSlug)} alt="" />
      <section className="panel profile-panel">
        <h2 className="listing-detail-price">{l.priceKori} kori</h2>
        <h3 className="listing-detail-title">{l.title}</h3>
        <p className="tab-note">
          {l.condition} · {l.category} · {l.placeName} · listed {l.tick}
          {l.status === "SOLD" ? ` · SOLD${buyer ? ` to ${buyer.name}` : ""}` : " · still open"}
        </p>
        {seller && (
          <Link href={`/agents/${seller.id}`} className="dds-result-row">
            <Avatar id={seller.id} name={seller.name} size={44} />
            <span><b>{seller.name}</b><small>{seller.job} · sells at {l.placeName}</small></span>
          </Link>
        )}
        <p className="fair-line">
          Citizens on the price: <b>{l.votesFair} fair</b> · {l.votesHigh} too high · {l.votesLow} a bargain
          {totalVotes > 0 ? ` — ${Math.round((l.votesFair / totalVotes) * 100)}% call it fair.` : ""}
        </p>
        <ListingActions listingId={l.id} initialVote={l.watcherVote} initialWatched={l.watched} />
      </section>
    </main>
  );
}
