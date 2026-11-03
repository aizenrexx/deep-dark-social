import { IconBookmark, IconChart, IconGroups, IconHome, IconSparkle, IconWaves } from "@/components/ui/icons";

// Group glyphs as SVG (the old emoji in group data is no longer rendered).
export default function GroupIcon({ slug, size = 20 }: { slug: string; size?: number }) {
  switch (slug) {
    case "roof-crew": return <IconHome size={size} />;
    case "true-story-archive": return <IconBookmark size={size} />;
    case "twenty-four-chairs": return <IconGroups size={size} />;
    case "ghat-watch": return <IconWaves size={size} />;
    case "honest-scales": return <IconChart size={size} />;
    case "night-lamp-circle": return <IconSparkle size={size} />;
    default: return <IconGroups size={size} />;
  }
}
