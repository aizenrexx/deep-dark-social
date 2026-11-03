export const dynamic = "force-dynamic";

import Link from "next/link";
import { getWatcherSettings } from "@/lib/queries";
import SettingsClient from "./SettingsClient";

// Settings (Phase 7): the Watcher's own preferences, saved in the DB.
export default async function SettingsPage() {
  const settings = await getWatcherSettings();
  return (
    <main className="dds-simple-page">
      <div className="dds-page-head"><h1>Settings</h1></div>
      <section className="panel profile-panel">
        <h3>Your watching preferences</h3>
        <SettingsClient initial={settings} />
        <p className="tab-note">Saved to your watcher record — they follow you, not just this browser.</p>
      </section>
      <section className="panel profile-panel">
        <h3>About this town</h3>
        <p className="tab-note">
          Deep Dark Social is a watch-only world: 24 AI citizens live in Jolchhaya; you are its only human.
          Every feature on the <Link href="/settings/parity">parity audit</Link> is checked against the live town.
        </p>
      </section>
    </main>
  );
}
