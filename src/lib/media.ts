// Media system (Wonder beauty spec §3): deterministic place illustration per post.
// Images live in /public/media/jolchhaya/*.webp — generated once, never at runtime.

export const PLACE_SLUG: Record<string, string> = {
  "Porishod Hall": "porishod-hall",
  "Press Para": "press-para",
  "Shapla Field": "shapla-field",
  "Adda Mor Tea Row": "adda-mor-tea-row",
  "Purano Bazaar": "purano-bazaar",
  "Kamar Para Workshops": "kamar-para-workshops",
  "Ghat Steps": "ghat-steps",
  "Night Lamp Corner": "night-lamp-corner",
};

export const PLACE_SLUGS = Object.values(PLACE_SLUG);

export const PLACE_BG: Record<string, string> = {
  "porishod-hall": "#86A98F",
  "press-para": "#7D8FB3",
  "shapla-field": "#79A86B",
  "adda-mor-tea-row": "#C98F4E",
  "purano-bazaar": "#C96F4A",
  "kamar-para-workshops": "#8C6A58",
  "ghat-steps": "#5E93A0",
  "night-lamp-corner": "#445A8A",
};

export function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function placeSlug(place: string | undefined | null): string {
  return PLACE_SLUG[(place ?? "").trim()] ?? "ghat-steps";
}

export function postImage(slug: string, variant: number): string {
  return `/media/jolchhaya/post-${slug}-${variant === 0 ? "establishing" : "detail"}.webp`;
}

export function storyImage(slug: string): string {
  return `/media/jolchhaya/story-${slug}.webp`;
}

export function coverImage(slug: string): string {
  return `/media/jolchhaya/cover-${slug}.webp`;
}

export const FEATURED = {
  river: "/media/jolchhaya/featured-river-panorama.webp",
  monsoon: "/media/jolchhaya/featured-monsoon-ghat-rain.webp",
  festival: "/media/jolchhaya/featured-festival-shapla-lights.webp",
  dawn: "/media/jolchhaya/featured-dawn-fishing-mist.webp",
} as const;

export type Grade = "grade-morning" | "grade-day" | "grade-dusk" | "grade-night";

export function gradeForTick(tick: string): Grade {
  const m = /(\d{1,2}):(\d{2})\s*$/.exec(tick.trim());
  if (!m) return "grade-day";
  const hh = parseInt(m[1], 10);
  if (hh >= 5 && hh < 11) return "grade-morning";
  if (hh >= 11 && hh < 17) return "grade-day";
  if (hh >= 17 && hh < 20) return "grade-dusk";
  return "grade-night";
}

export type PostMedia = { src: string; slug: string; grade: Grade; alt: string; variant: string };

// Spec §3.5: explicit types always show media; generic types mostly; others half.
// Adjacency rule applied across the ordered list: never the same asset twice in a row.
const EXPLICIT = new Set(["project", "notice", "challenge", "event"]);
const GENERIC = new Set(["field note", "ledger", "story", "update", "post", "announcement", "status", "note"]);

export function assignMedia<T extends { id: number; type: string; place: string; tick: string }>(
  posts: T[],
): (PostMedia | null)[] {
  let prevSrc: string | null = null;
  return posts.map((post) => {
    const slug = placeSlug(post.place);
    const seed = fnv1a(String(post.id));
    const t = post.type.trim().toLowerCase();
    const show = EXPLICIT.has(t)
      ? true
      : GENERIC.has(t)
        ? seed % 3 !== 0
        : seed % 2 === 0;
    if (!show) return null;
    let variant = seed % 2;
    let src = postImage(slug, variant);
    if (src === prevSrc) {
      variant = 1 - variant;
      src = postImage(slug, variant);
    }
    prevSrc = src;
    return { src, slug, grade: gradeForTick(post.tick), alt: `${post.place} — Jolchhaya, ${post.tick}`, variant: variant === 0 ? "establishing" : "detail" };
  });
}

// App-shell spec §5: collage sets per post from the place pool
// [establishing, detail, story, cover]. Eligibility mirrors assignMedia;
// the first three posts of any list stay single-photo (zero-break rule).
const SET_VARIANTS: { variant: string; src: (slug: string) => string }[] = [
  { variant: "establishing", src: (s) => postImage(s, 0) },
  { variant: "detail", src: (s) => postImage(s, 1) },
  { variant: "story", src: (s) => storyImage(s) },
  { variant: "cover", src: (s) => coverImage(s) },
];

export function assignMediaSets<T extends { id: number; type: string; place: string; tick: string }>(
  posts: T[],
): PostMedia[][] {
  const singles = assignMedia(posts);
  return posts.map((post, idx) => {
    const single = singles[idx];
    if (!single) return [];
    if (idx < 3) return [single];
    const r = fnv1a(`set:${post.id}`) % 10;
    const count = r <= 3 ? 1 : r <= 6 ? 2 : r <= 8 ? 3 : 4;
    if (count === 1) return [single];
    const slug = placeSlug(post.place);
    return SET_VARIANTS.slice(0, count).map((v) => ({
      src: v.src(slug),
      slug,
      grade: gradeForTick(post.tick),
      alt: `${post.place} — Jolchhaya, ${post.tick}`,
      variant: v.variant,
    }));
  });
}

// Dominant place of a citizen from their posts (spec §5.1): most posts wins,
// ties break by most recent post, then alphabetically by slug.
export function dominantPlaceSlug(
  posts: { place: string }[],
  fallbackSeed: string,
): string {
  if (posts.length === 0) return PLACE_SLUGS[fnv1a(fallbackSeed) % PLACE_SLUGS.length];
  const counts = new Map<string, { n: number; last: number }>();
  posts.forEach((p, i) => {
    const s = placeSlug(p.place);
    const cur = counts.get(s) ?? { n: 0, last: -1 };
    cur.n += 1;
    cur.last = i; // posts arrive newest-first: smaller index = more recent
    counts.set(s, cur);
  });
  let best: string | null = null;
  let bestN = -1;
  let bestLast = Infinity;
  for (const [slug, c] of counts) {
    if (c.n > bestN || (c.n === bestN && c.last < bestLast) || (c.n === bestN && c.last === bestLast && (best === null || slug < best))) {
      best = slug; bestN = c.n; bestLast = c.last;
    }
  }
  return best ?? "ghat-steps";
}

export const COVER_TINTS = [
  "linear-gradient(105deg, rgba(24,119,242,.14), transparent 60%)",
  "linear-gradient(105deg, rgba(14,116,100,.14), transparent 60%)",
  "linear-gradient(105deg, rgba(214,150,32,.14), transparent 60%)",
  "linear-gradient(105deg, rgba(197,74,110,.14), transparent 60%)",
];

export function coverTint(seedKey: string): string {
  return COVER_TINTS[fnv1a(seedKey) % COVER_TINTS.length];
}

const GROUP_TINTS = ["#1877F2", "#0E7464", "#D69620", "#C54A6E", "#6C4AB0", "#C2512F"];
const GROUP_POS = ["center 35%", "center 50%", "center 65%"];

// Spec §5.2: group covers rotate through the panorama pool with a per-group
// tint + crop position so every group reads unique.
export function groupCoverArt(seedKey: string) {
  const h = fnv1a(seedKey);
  return {
    src: coverImage(PLACE_SLUGS[h % PLACE_SLUGS.length]),
    tint: GROUP_TINTS[h % GROUP_TINTS.length],
    objectPosition: GROUP_POS[h % GROUP_POS.length],
  };
}
