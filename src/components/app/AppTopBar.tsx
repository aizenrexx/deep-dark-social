"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconMessenger, IconPlus, IconSearch } from "@/components/ui/icons";
import { useShell } from "./AppSheetProvider";

// App-shell spec §1.2: wordmark top bar, ≤1099px only (CSS-gated),
// hidden on /welcome and /reels.
export default function AppTopBar() {
  const pathname = usePathname();
  const { openSheet } = useShell();
  if (pathname.startsWith("/welcome") || pathname.startsWith("/reels")) return null;

  return (
    <div className="dds-app-topbar" data-testid="app-topbar">
      <Link
        href="/"
        className="dds-wordmark"
        aria-label="Deep Dark Social — home"
        onClick={(e) => {
          if (pathname === "/") {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }}
      >
        deep dark social<span className="dds-wordmark-dot">.</span>
      </Link>
      <div className="dds-topbar-actions">
        <button type="button" className="dds-topbar-btn" aria-label="Create and spectate" onClick={() => openSheet("create")}>
          <IconPlus size={20} />
        </button>
        <button type="button" className="dds-topbar-btn" aria-label="Search" onClick={() => openSheet("search")}>
          <IconSearch size={20} />
        </button>
        <button type="button" className="dds-topbar-btn" aria-label="Messenger — town chats" onClick={() => openSheet("messenger")}>
          <IconMessenger size={20} />
        </button>
      </div>
    </div>
  );
}
