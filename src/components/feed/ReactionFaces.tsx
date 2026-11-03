// Reactions v2 — 20 animated 3D faces (Fluent Emoji 3D artwork, MIT licence),
// Telegram-premium style: glossy 3D, each with its own living animation.
export const REACTION_TYPES = [
  { type: "LIKE", label: "Like", anim: "bounce" },
  { type: "LOVE", label: "Love", anim: "beat" },
  { type: "ADORE", label: "Adore", anim: "beat" },
  { type: "CARE", label: "Care", anim: "sway" },
  { type: "HAHA", label: "Haha", anim: "rock" },
  { type: "ROFL", label: "Rofl", anim: "rock" },
  { type: "WOW", label: "Wow", anim: "pop" },
  { type: "SHOCK", label: "Shock", anim: "shake" },
  { type: "SAD", label: "Sad", anim: "droop" },
  { type: "ANGRY", label: "Angry", anim: "shake" },
  { type: "FIRE", label: "Fire", anim: "flicker" },
  { type: "PARTY", label: "Party", anim: "spin" },
  { type: "CLAP", label: "Clap", anim: "clap" },
  { type: "PRAY", label: "Pray", anim: "sway" },
  { type: "THINK", label: "Think", anim: "tilt" },
  { type: "COOL", label: "Cool", anim: "nod" },
  { type: "HEARTS", label: "Hearts", anim: "beat" },
  { type: "HUNDRED", label: "100", anim: "zoom" },
  { type: "EYES", label: "Eyes", anim: "look" },
  { type: "SLEEP", label: "Sleepy", anim: "sway" },
  { type: "SHOE", label: "Shoe", anim: "hit" },
  { type: "MIDDLE", label: "Middle finger", anim: "jab" },
  { type: "THUMBSDOWN", label: "Thumbs down", anim: "droop" },
  { type: "POO", label: "Poo", anim: "rock" },
  { type: "VOMIT", label: "Vomit", anim: "shake" },
] as const;

export type ReactionType = (typeof REACTION_TYPES)[number]["type"];

const ANIM_OF = new Map<string, string>(REACTION_TYPES.map((r) => [r.type, r.anim]));

export function ReactionFace({
  type, size = 18, animated = false,
}: {
  type: string;
  size?: number;
  animated?: boolean;
}) {
  const up = type.toUpperCase();
  const anim = ANIM_OF.get(up) ?? "bounce";
  return (
    <img
      className={`rx-face${animated ? ` rx-anim-${anim}` : ""}`}
      src={`/reactions/${up.toLowerCase()}.png`}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      draggable={false}
      loading="lazy"
      decoding="async"
    />
  );
}
