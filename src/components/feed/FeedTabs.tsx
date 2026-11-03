import Link from "next/link";

export const FEED_TABS = [
  { key: "home", label: "Home" },
  { key: "favorites", label: "Favourites" },
  { key: "groups", label: "Groups" },
  { key: "pages", label: "Pages" },
  { key: "polls", label: "Polls" },
  { key: "photos", label: "Photos" },
  { key: "recent", label: "Most Recent" },
] as const;

export type FeedTabKey = (typeof FEED_TABS)[number]["key"];

// Feed tab bar (master plan §2.1) — server-filtered views of the same feed.
export default function FeedTabs({ active }: { active: FeedTabKey }) {
  return (
    <nav className="feed-tabs" aria-label="Feed views" data-testid="feed-tabs">
      {FEED_TABS.map((t) => (
        <Link
          key={t.key}
          href={t.key === "home" ? "/" : `/?tab=${t.key}`}
          className={`feed-tab${active === t.key ? " active" : ""}`}
          aria-current={active === t.key ? "page" : undefined}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
