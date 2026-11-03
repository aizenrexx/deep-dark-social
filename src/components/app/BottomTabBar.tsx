"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import { IconBell, IconClapper, IconHome, IconMenu, IconPersonCircle } from "@/components/ui/icons";
import { getNotifSeen } from "@/lib/watcher";

// In-flow spacer so page content is never hidden behind the fixed tab bar.
export function TabBarSpacer() {
  const pathname = usePathname();
  if (pathname.startsWith("/welcome") || pathname.startsWith("/reels")) return null;
  return <div className="dds-tabbar-spacer" aria-hidden="true" />;
}

// App-shell spec §1.5: 5-tab bottom bar, always fixed ≤1099px.
export default function BottomTabBar({
  notifications,
}: {
  notifications: { id: number; text: string; href: string }[];
}) {
  const pathname = usePathname();
  const [unread, setUnread] = useState(notifications.length);
  const [inboxBadge, setInboxBadge] = useState(0);

  useEffect(() => {
    const compute = () => {
      const seen = getNotifSeen();
      setUnread(notifications.filter((n) => !seen.has(String(n.id))).length);
      try {
        const storiesSeen: string[] = JSON.parse(localStorage.getItem("dds-stories-seen") ?? "[]");
        const meVisited = localStorage.getItem("dds-me-visited");
        const today = new Date().toDateString();
        setInboxBadge(!storiesSeen.includes("episode") && meVisited !== today ? 1 : 0);
      } catch { setInboxBadge(0); }
    };
    compute();
    window.addEventListener("dds-notif-changed", compute);
    return () => window.removeEventListener("dds-notif-changed", compute);
  }, [notifications, pathname]);

  if (pathname.startsWith("/welcome")) return null;

  const dark = pathname.startsWith("/reels");
  const active =
    pathname.startsWith("/reels") ? "reels"
    : pathname.startsWith("/friends") || pathname.startsWith("/agents") ? "friends"
    : pathname.startsWith("/notifications") ? "notifications"
    : pathname.startsWith("/me") ? "me"
    : "home";

  const tabCls = (t: string) => `dds-tab${active === t ? " active" : ""}`;
  const scrollTop = (e: React.MouseEvent, t: string) => {
    if (active === t) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <nav className={`dds-app-tabbar${dark ? " dark" : ""}`} data-testid="app-tabbar" aria-label="Main tabs">
      <div className="dds-tabbar-inner">
        <Link href="/" className={tabCls("home")} aria-label="Home" aria-current={active === "home" ? "page" : undefined} onClick={(e) => scrollTop(e, "home")}>
          <IconHome size={26} />
        </Link>
        <Link href="/reels" className={tabCls("reels")} aria-label="Reels" aria-current={active === "reels" ? "page" : undefined}>
          <IconClapper size={26} />
        </Link>
        <Link href="/friends" className={tabCls("friends")} aria-label="Friends — citizens" aria-current={active === "friends" ? "page" : undefined}>
          <IconPersonCircle size={26} />
        </Link>
        <Link href="/notifications" className={tabCls("notifications")} aria-label="Notifications" aria-current={active === "notifications" ? "page" : undefined}>
          <span className="dds-tab-icon-wrap">
            <IconBell size={26} />
            {unread > 0 && <span className="dds-badge">{unread > 99 ? "99+" : unread}</span>}
          </span>
        </Link>
        <Link href="/me" className={tabCls("me")} aria-label="Watcher — your page" aria-current={active === "me" ? "page" : undefined}>
          <span className="dds-avatar-wrap">
            <Avatar id="watcher-riyad" name="Riyad" size={30} />
            {inboxBadge > 0 && <span className="dds-badge avatar-badge">{inboxBadge}</span>}
            <span className="dds-avatar-chip"><IconMenu size={9} /></span>
          </span>
        </Link>
      </div>
    </nav>
  );
}
