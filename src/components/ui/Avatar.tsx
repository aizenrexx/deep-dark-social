// Deterministic SVG portrait per citizen — same face at every size.
// Seeded by citizen id (Wonder fidelity audit v2, item 3: no letter discs).

const SKIN = ["#8D5524", "#A9714B", "#C68642", "#E0AC69", "#F1C27D", "#FFDBAC", "#7A4A21", "#B07B4F"];
const HAIR_C = ["#191410", "#2E1E12", "#4A2E17", "#6E4520", "#8C8C8C", "#C0C0C0", "#3B3B3B", "#59331A"];
const SHIRT = ["#7A1F1F", "#1F4E79", "#1E6B52", "#6B4E12", "#4A2D6B", "#7A3B1E", "#205A6B", "#5B2333", "#2F4858", "#715C1F"];
// Wonder spec §7: bright pastel backgrounds only — never a dark disc.
const BG = [
  "#F6C177", "#F2A65A", "#EE8F8F", "#E7A6C9", "#C4A7E0", "#93C6DE",
  "#82BFAE", "#A9C97E", "#F0D060", "#EFAE6B", "#D9A05B", "#BFD16D",
];

function hash(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function fnv1a(s: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}

const HAIRS = [
  // short crop
  <path key="h0" d="M28 44c0-14 9-22 22-22s22 8 22 22c0 2-1 3-3 2-2-8-6-12-19-12s-17 4-19 12c-2 1-3 0-3-2z" />,
  // side sweep
  <path key="h1" d="M27 46c-1-15 10-24 23-24 11 0 21 7 22 20 0 3-2 4-4 2C64 34 52 30 42 33c-6 2-10 6-12 13-1 2-3 2-3 0z" />,
  // bun
  <>
    <circle key="h2a" cx="50" cy="16" r="9" />
    <path key="h2b" d="M28 45c0-13 9-21 22-21s22 8 22 21c0 2-1 3-3 2-2-8-7-11-19-11s-17 3-19 11c-2 1-3 0-3-2z" />
  </>,
  // long sides
  <path key="h3" d="M24 78V44c0-14 11-23 26-23s26 9 26 23v34c0 3-5 3-6 0V42c-3-6-9-9-20-9s-17 3-20 9v36c-1 3-6 3-6 0z" />,
  // wavy top
  <path key="h4" d="M28 42c2-4 1-6 4-9 2-2 5-1 7-3 3-3 6-5 11-5 4 0 6 2 9 3 4 1 7 1 9 4 2 2 1 5 3 7 1 2 1 5-2 5-3 0-4-3-7-6-3-2-7-3-12-3s-9 1-12 3c-3 3-4 6-7 6-3 0-4-1-3-2z" />,
  // bald / very short
  <path key="h5" d="M29 40c2-11 10-17 21-17s19 6 21 17c-6-5-12-7-21-7s-15 2-21 7z" opacity=".55" />,
];

export default function Avatar({
  id, name, size = 40, className,
}: { id: string; name: string; size?: number; className?: string }) {
  const h = hash(id);
  const skin = SKIN[h % SKIN.length];
  const hairC = HAIR_C[(h >> 3) % HAIR_C.length];
  const shirt = SHIRT[(h >> 5) % SHIRT.length];
  const bg = BG[fnv1a(id + ":bg") % BG.length];
  const hair = HAIRS[(h >> 9) % HAIRS.length];
  return (
    <svg
      width={size} height={size} viewBox="0 0 100 100"
      className={className} role="img" aria-label={name}
      style={{ borderRadius: "50%", display: "block", flex: "none", background: bg, boxShadow: "inset 0 0 0 1px rgba(0,0,0,.08)" }}
    >
      <rect width="100" height="100" fill={bg} />
      <path d="M14 100c2-16 16-24 36-24s34 8 36 24z" fill={shirt} />
      <rect x="43" y="58" width="14" height="16" rx="5" fill={skin} />
      <ellipse cx="50" cy="46" rx="21" ry="24" fill={skin} />
      <g fill={hairC}>{hair}</g>
      <circle cx="42.5" cy="48" r="2.1" fill="#241a12" />
      <circle cx="57.5" cy="48" r="2.1" fill="#241a12" />
      <path d="M44 60c2 2 4 3 6 3s4-1 6-3" stroke="#8a5a33" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}
