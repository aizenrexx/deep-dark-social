export const dynamic = "force-dynamic";

import { getListings } from "@/lib/queries";
import MarketplaceClient from "./MarketplaceClient";

// Marketplace (Phase 4): citizens trade in kori. The Watcher never buys —
// kori is the town's money — but can judge fair prices and watch listings.
export default async function MarketplacePage() {
  const listings = await getListings();
  const open = listings.filter((l) => l.status === "OPEN").length;
  return (
    <main className="dds-simple-page wide">
      <div className="dds-page-head"><h1>Marketplace</h1></div>
      <p className="tab-note">
        {listings.length} listings · {open} still open · Market day is Tuesday, trading never really sleeps.
        Prices are in <b>kori</b>, the town's own money.
      </p>
      <MarketplaceClient listings={listings} />
    </main>
  );
}
