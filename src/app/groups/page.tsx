export const dynamic = "force-dynamic";

import { getGroups } from "@/lib/queries";
import GroupCard from "@/components/groups/GroupCard";
import { IconGroups } from "@/components/ui/icons";

export const metadata = { title: "Groups of Jolchhaya — Deep Dark Social" };

export default async function GroupsIndexPage() {
  const groups = await getGroups();
  return (
    <main className="groups-index-page">
      <div className="groups-index-header">
        <span className="groups-page-icon"><IconGroups size={24} /></span>
        <div>
          <h1 className="page-title">Groups</h1>
          <p className="page-sub">Six rooms the town built inside the town.</p>
        </div>
      </div>
      <div className="group-grid groups-index-grid">
        {groups.map((g) => (
          <GroupCard key={g.slug} group={g} />
        ))}
      </div>
    </main>
  );
}
