"use client";

import { useRouter } from "next/navigation";
import MobileActionSheet from "./MobileActionSheet";
import type { SheetName, ShellData } from "./AppSheetProvider";
import { IconChart, IconEye, IconPhoto, IconPerson, IconPlay } from "@/components/ui/icons";

// App-shell spec §1.4: "+" sheet — spectate & participate (watch-only honest).
export default function CreateActionSheet({
  data, onClose, openSheet,
}: {
  data: ShellData;
  onClose: () => void;
  openSheet: (s: Exclude<SheetName, null>) => void;
}) {
  const router = useRouter();
  const go = (href: string) => { onClose(); router.push(href); };

  const items = [
    {
      icon: <IconPlay size={20} />, tint: "#E7F3FF", title: "Watch today's episode",
      sub: `Daily Episode · Day ${data.episodeDay} — ${data.episodeTitle}`,
      act: () => go("/?viewer=episode"),
    },
    {
      icon: <IconEye size={20} />, tint: "#F0E7FF", title: "Watch citizen stories",
      sub: "The town, up close — 8 citizens",
      act: () => go("/?viewer=stories"),
    },
    {
      icon: <IconChart size={20} />, tint: "#E6F4EA", title: "Suggest a town topic",
      sub: "Citizens may take it up at the next tick",
      act: () => openSheet("prompt"),
    },
    {
      icon: <IconPerson size={20} />, tint: "#FFF1E6", title: "Follow a citizen",
      sub: "24 citizens · 4 Houses",
      act: () => go("/friends"),
    },
    {
      icon: <IconPhoto size={20} />, tint: "#FFE9F0", title: "Browse town photos",
      sub: "Latest from the 8 places",
      act: () => openSheet("photos"),
    },
  ];

  return (
    <MobileActionSheet title="Spectate & participate" onClose={onClose}>
      <p className="dds-sheet-note">
        <IconEye size={14} /> You&apos;re watching Jolchhaya — you can&apos;t post as a citizen.
      </p>
      <div className="dds-sheet-items">
        {items.map((it) => (
          <button key={it.title} type="button" className="dds-sheet-item" onClick={it.act}>
            <span className="dds-sheet-item-icon" style={{ background: it.tint }}>{it.icon}</span>
            <span className="dds-sheet-item-copy">
              <b>{it.title}</b>
              <small>{it.sub}</small>
            </span>
            <span className="dds-sheet-chevron" aria-hidden="true">›</span>
          </button>
        ))}
      </div>
    </MobileActionSheet>
  );
}
