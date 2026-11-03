// Inline SVG icon set — Facebook-style chunky filled glyphs, currentColor.
// No emoji in UI chrome (Wonder fidelity audit v2, item 1).

type P = { size?: number; className?: string };

function base(size: number, className?: string) {
  return {
    width: size, height: size, viewBox: "0 0 24 24",
    fill: "currentColor", className, "aria-hidden": true as const, focusable: false as const,
  };
}

export const IconHome = ({ size = 28, className }: P) => (
  <svg {...base(size, className)}><path d="M12 2.8 22 12h-2.6v8.2c0 .7-.5 1.2-1.2 1.2h-4v-6.6H9.8v6.6h-4c-.7 0-1.2-.5-1.2-1.2V12H2z" /></svg>
);
export const IconPlayRect = ({ size = 28, className }: P) => (
  <svg {...base(size, className)}><path fillRule="evenodd" d="M3.5 5h17c.8 0 1.5.7 1.5 1.5v11c0 .8-.7 1.5-1.5 1.5h-17C2.7 19 2 18.3 2 17.5v-11C2 5.7 2.7 5 3.5 5zm6.2 4.4v5.2c0 .6.7 1 1.2.7l4-2.6c.5-.3.5-1 0-1.3l-4-2.6c-.5-.4-1.2 0-1.2.6z" /></svg>
);
export const IconStore = ({ size = 28, className }: P) => (
  <svg {...base(size, className)}><path d="M4.2 3.5h15.6l1.4 5.2c0 .1.1.3.1.4 0 1.6-1.3 3-2.9 3-1.2 0-2.2-.7-2.7-1.7-.5 1-1.5 1.7-2.7 1.7s-2.2-.7-2.7-1.7c-.5 1-1.5 1.7-2.7 1.7-1.6 0-2.9-1.4-2.9-3 0-.1 0-.3.1-.4L4.2 3.5zM5 13.6c.9.4 1.9.5 2.9.2V21h8.2v-7.2c1 .3 2 .2 2.9-.2v6.2c0 .7-.5 1.2-1.2 1.2H6.2C5.5 21 5 20.5 5 19.8v-6.2zM9.6 21v-5.4h4.8V21H9.6z" /></svg>
);
export const IconGroups = ({ size = 28, className }: P) => (
  <svg {...base(size, className)}><path d="M12 11.5a3.8 3.8 0 1 0 0-7.6 3.8 3.8 0 0 0 0 7.6zm7.2 1.1a3.2 3.2 0 1 0-2.2-5.5 4.9 4.9 0 0 1 0 5.6c.6-.3 1.4-.4 2.2-.1zM4.8 12.6c.8-.3 1.6-.2 2.2.1a4.9 4.9 0 0 1 0-5.6 3.2 3.2 0 1 0-2.2 5.5zM12 13.4c-3.5 0-7.5 1.9-7.5 4.4V20h15v-2.2c0-2.5-4-4.4-7.5-4.4zm7.7 4.5c-.3-1.6-1.7-3-3.6-3.9 2.3.3 4.9 1.7 4.9 3.6v1.9h-1.3v-1.6zM4.3 17.9v1.6H3v-1.9c0-1.9 2.6-3.3 4.9-3.6-1.9.9-3.3 2.3-3.6 3.9z" /></svg>
);
export const IconPerson = ({ size = 28, className }: P) => (
  <svg {...base(size, className)}><path d="M12 11.8a4.4 4.4 0 1 0 0-8.8 4.4 4.4 0 0 0 0 8.8zM12 13.6c-4 0-8 2.2-8 5V20h16v-1.4c0-2.8-4-5-8-5z" /></svg>
);
export const IconMenuGrid = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}>{[4, 12, 20].map((cy) => [4, 12, 20].map((cx) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={2.1} />))}</svg>
);
export const IconMessenger = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}><path fillRule="evenodd" d="M12 2.5c5.5 0 9.7 3.9 9.7 8.9 0 5-4.2 8.9-9.7 8.9-1 0-2-.1-2.9-.4L5 21.5v-3.1C3.3 16.7 2.3 14.2 2.3 11.4 2.3 6.4 6.5 2.5 12 2.5zm-4.6 11.9 3-3.7 2.2 2.2 3.9-3.7-3 3.7-2.2-2.2-3.9 3.7z" /></svg>
);
export const IconBell = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}><path d="M12 2.8a6.2 6.2 0 0 1 6.2 6.2c0 3.9 1.4 5.4 2 6.2H3.8c.6-.8 2-2.3 2-6.2A6.2 6.2 0 0 1 12 2.8zM9.9 18h4.2a2.3 2.3 0 0 1-4.2 0z" /></svg>
);
export const IconSearch = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}><path d="M10.8 3.5a7.3 7.3 0 1 0 4.4 13.1l4.3 4.3a1.2 1.2 0 0 0 1.7-1.7l-4.3-4.3A7.3 7.3 0 0 0 10.8 3.5zm0 2.4a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8z" /></svg>
);
export const IconChevronDown = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}><path d="M12 15.6 3.4 7l1.7-1.7L12 12.2l6.9-6.9L20.6 7z" /></svg>
);
export const IconThumb = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}><path d="M2.5 10.8h3.8v10H2.5zM7.9 20.8h10.3c.9 0 1.7-.6 1.9-1.5l1.2-6c.2-1.1-.6-2.1-1.7-2.1h-4.9l.9-4.3c.2-1.2-.5-2.4-1.6-2.9-.4-.2-.9 0-1.2.4L7.9 10.9v9.9zM21.5 13.2l-1.2 6" opacity=".0" /></svg>
);
export const IconComment = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}><path d="M4.5 3.5h15c1.1 0 2 .9 2 2v8.6c0 1.1-.9 2-2 2H10l-5.3 4.3V5.5c0-1.1.9-2 2-2h-2.2zm2 3.6v6.7l2.9-2.4h10.1V7.1H6.5z" opacity=".0" /><path d="M12 2.8c5.7 0 10.2 3.9 10.2 8.7 0 4.8-4.5 8.7-10.2 8.7-1 0-1.9-.1-2.8-.3L4.6 21.2v-3.4C3.2 16.2 1.8 14 1.8 11.5c0-4.8 4.5-8.7 10.2-8.7z" /></svg>
);
export const IconShare = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}><path d="M13.2 4.2V2l8 7.2-8 7.2v-2.9C8 13.5 5 15.4 2.9 19.7c-.3-5.3 2.8-11.3 10.3-12.4V4.2z" /></svg>
);
export const IconGlobe = ({ size = 12, className }: P) => (
  <svg {...base(size, className)}><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm7.9 9h-3.2a15.7 15.7 0 0 0-1.2-5.3A8.03 8.03 0 0 1 19.9 11zM12 4.1c.9 1.2 1.9 3.4 2.1 6.9h-4.2c.2-3.5 1.2-5.7 2.1-6.9zM4.1 13h3.2c.2 2 .6 3.8 1.2 5.3A8.03 8.03 0 0 1 4.1 13zm0-2a8.03 8.03 0 0 1 4.4-5.3c-.6 1.5-1 3.3-1.2 5.3H4.1zm7.9 8.9c-.9-1.2-1.9-3.4-2.1-6.9h4.2c-.2 3.5-1.2 5.7-2.1 6.9zm2.3-8.9h-4.6c.1-2.4.6-4.4 1.1-5.8h2.4c.5 1.4 1 3.4 1.1 5.8zm.2 2c-.1 2.4-.6 4.4-1.1 5.8h-2.8c-.5-1.4-1-3.4-1.1-5.8h5zm1 5.3c.6-1.5 1-3.3 1.2-5.3h3.2a8.03 8.03 0 0 1-4.4 5.3z" /></svg>
);
export const IconDots = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
);
export const IconClose = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}><path d="M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4L12 13.4 6.4 19 5 17.6 10.6 12 5 6.4z" /></svg>
);
export const IconVideoCam = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><path d="M3 7.2C3 6 3.9 5 5.1 5h9.8c1.2 0 2.1 1 2.1 2.2v9.6c0 1.2-.9 2.2-2.1 2.2H5.1C3.9 19 3 18 3 16.8V7.2zM21 8l-3 2.4v3.2L21 16V8z" /></svg>
);
export const IconPhoto = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><path d="M3.5 5h17c.8 0 1.5.7 1.5 1.5v11c0 .8-.7 1.5-1.5 1.5h-17C2.7 19 2 18.3 2 17.5v-11C2 5.7 2.7 5 3.5 5zM8.6 10.1a1.9 1.9 0 1 0 0-3.9 1.9 1.9 0 0 0 0 3.9zM21 15.4l-4.9-4.9-8.6 8.5h12c.8 0 1.5-.7 1.5-1.5v-2.1z" opacity=".95" /></svg>
);
export const IconChart = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><path d="M4 20V10h3.4v10H4zm6.3 0V4h3.4v16h-3.4zm6.3 0v-7.4H20V20h-3.4z" /></svg>
);
export const IconPlus = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}><path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z" /></svg>
);
export const IconBookmark = ({ size = 28, className }: P) => (
  <svg {...base(size, className)}><path d="M6.5 3.5h11V21L12 16.9 6.5 21z" /></svg>
);
export const IconClock = ({ size = 28, className }: P) => (
  <svg {...base(size, className)}><path d="M12 2.5A9.5 9.5 0 1 0 21.5 12h-2.3A7.2 7.2 0 1 1 12 4.8v7.4l4.6 2.7-1.1 2L10.8 14V4.9A9.5 9.5 0 0 0 12 2.5z" /></svg>
);
export const IconCalendar = ({ size = 28, className }: P) => (
  <svg {...base(size, className)}><path d="M7 3v2.5H5.5A2.5 2.5 0 0 0 3 8v10.5A2.5 2.5 0 0 0 5.5 21h13a2.5 2.5 0 0 0 2.5-2.5V8a2.5 2.5 0 0 0-2.5-2.5H17V3h-2.2v3.5H9.2V3H7zm-4 7.5h18V18a.5.5 0 0 1-.5.5h-17a.5.5 0 0 1-.5-.5v-7.5z" /></svg>
);
export const IconGift = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}><path d="M3.5 8h17v3.5h-17zM5 12.5h6.2V21H6.7A1.7 1.7 0 0 1 5 19.3V12.5zm7.8 0H19v6.8c0 .9-.8 1.7-1.7 1.7h-4.5v-8.5zM12 7.7C10.4 7.6 8.6 6.4 8.6 5c0-1.2 1-2.1 2.1-2.1 1.3 0 1.3 1.6 1.3 4.8zm0 0c1.6-.1 3.4-1.3 3.4-2.7 0-1.2-1-2.1-2.1-2.1C12 2.9 12 4.5 12 7.7z" /></svg>
);

// ——— Round-3 additions (emoji purge, Wonder spec §6) ———
export const IconBriefcase = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}><path d="M9 6.5V5.8C9 4.3 10.3 3 11.8 3h.4C13.7 3 15 4.3 15 5.8v.7h3.4A2.6 2.6 0 0 1 21 9.1v1.1c-1.8.9-4.3 1.4-7 1.3V14a2 2 0 0 1-4 0v-2.5C7.3 11.6 4.8 11.1 3 10.2V9.1A2.6 2.6 0 0 1 5.6 6.5H9zm2.2 0h1.6V5.8c0-.4-.3-.6-.6-.6h-.4c-.3 0-.6.2-.6.6v.7zM3 12.4c1.9.8 4.2 1.2 7 1.3.3 1 .9 1.5 2 1.5s1.7-.5 2-1.5c2.8-.1 5.1-.5 7-1.3v5.4a2.6 2.6 0 0 1-2.6 2.6H5.6A2.6 2.6 0 0 1 3 18.8V12.4z" /></svg>
);
export const IconBot = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}><path d="M13 3.5h-2V7h2V3.5zM12 1.8a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6zM6.5 8h11A3.5 3.5 0 0 1 21 11.5v6A3.5 3.5 0 0 1 17.5 21h-11A3.5 3.5 0 0 1 3 17.5v-6A3.5 3.5 0 0 1 6.5 8zM8.6 12.2a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8zm6.8 0a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8zM1.5 11h1.7v5H1.5c-.8 0-1-.4-1-1v-3c0-.6.2-1 1-1zm21 0c.8 0 1 .4 1 1v3c0 .6-.2 1-1 1h-1.7v-5h1.7z" transform="scale(.92) translate(1,1)" /></svg>
);
export const IconMapPin = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}><path d="M12 2a7.5 7.5 0 0 1 7.5 7.5c0 5.4-6.6 11.7-7 12.1a.7.7 0 0 1-1 0c-.4-.4-7-6.7-7-12.1A7.5 7.5 0 0 1 12 2zm0 10.4a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" /></svg>
);
export const IconWaves = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}><path d="M2 7.2c2-2.1 4-2.1 6 0 1.9 2 3.9 2 5.8 0 2-2.1 4-2.1 6 0 .6.6.6 1.5 0 2.2-.6.7-1.6.6-2.6-.1-1.5-1-2.9-1-4.4 0-2 2.1-4 2.1-6 0s-4-2.1-6 0c-.6.6-1.5.6-2.1 0-.7-.6-.7-1.5 0-2.1zM2 13.2c2-2.1 4-2.1 6 0 1.9 2 3.9 2 5.8 0 2-2.1 4-2.1 6 0 .6.6.6 1.5 0 2.2-.6.7-1.6.6-2.6-.1-1.5-1-2.9-1-4.4 0-2 2.1-4 2.1-6 0s-4-2.1-6 0c-.6.6-1.5.6-2.1 0-.7-.6-.7-1.5 0-2.1z" transform="translate(0,-1)" /></svg>
);
export const IconSparkle = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" /></svg>
);
export const IconLock = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}><path d="M12 2.8a5 5 0 0 1 5 5V11h.8A2.2 2.2 0 0 1 20 13.2v5.6a2.2 2.2 0 0 1-2.2 2.2H6.2A2.2 2.2 0 0 1 4 18.8v-5.6A2.2 2.2 0 0 1 6.2 11H7V7.8a5 5 0 0 1 5-5zm0 2.2a2.8 2.8 0 0 0-2.8 2.8V11h5.6V7.8A2.8 2.8 0 0 0 12 5zm0 8.4a1.9 1.9 0 0 1 1.9 1.9c0 .8-.4 1.3-1 1.7v1.4a.9.9 0 0 1-1.8 0v-1.4c-.6-.4-1-1-1-1.7A1.9 1.9 0 0 1 12 13.2z" /></svg>
);
export const IconPin = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}><path d="M14.8 3.2a1 1 0 0 1 1.4 0l4.6 4.6a1 1 0 0 1-.4 1.6l-3.9 1.6-1.7 4.3a1 1 0 0 1-1.7.3l-2-2.3-5.4 5.4a1 1 0 0 1-1.4-1.4l5.4-5.4-2.3-2A1 1 0 0 1 7.7 9.2l4.3-1.7 1.6-3.9a1 1 0 0 1 1.2-.4z" transform="rotate(45 12 12)" /></svg>
);
export const IconPlay = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}><path d="M8 5.3v13.4c0 .9 1 1.5 1.8 1L20 13a1.2 1.2 0 0 0 0-2L9.8 4.3C9 3.8 8 4.4 8 5.3z" /></svg>
);
export const IconChevronLeft = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}><path d="M14.7 3.3a1.2 1.2 0 0 1 0 1.7L9.4 12l5.3 7a1.2 1.2 0 1 1-1.9 1.4l-6-7.9a1.2 1.2 0 0 1 0-1.4l6-7.9c.4-.6 1.3-.6 1.9.1z" transform="scale(-1,1) translate(-24,0)" /></svg>
);
export const IconChevronRight = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}><path d="M9.3 3.3a1.2 1.2 0 0 1 1.9-.1l6 7.9a1.2 1.2 0 0 1 0 1.4l-6 7.9A1.2 1.2 0 1 1 9.3 19l5.3-7-5.3-7a1.2 1.2 0 0 1 0-1.7z" /></svg>
);
export const IconHeart = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}><path d="M12 20.7S3.4 15.4 3.4 9.6A4.7 4.7 0 0 1 12 6.9a4.7 4.7 0 0 1 8.6 2.7c0 5.8-8.6 11.1-8.6 11.1z" /></svg>
);
export const IconClapper = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}><path d="M3.6 9.2h16.8c.6 0 1 .4 1 1V20c0 .6-.4 1-1 1H3.6c-.6 0-1-.4-1-1v-9.8c0-.6.4-1 1-1zm7.4 4v5l4.4-2.5L11 13.2zM2.9 7.6 4.8 3.2c.2-.5.8-.7 1.3-.5l13.9 5.1c.5.2.8.7.6 1.2l-.5 1.2L3.4 8.9l-.5-1.3zM7 5.3l1.9 1.3 1-1.6L8 3.8 7 5.3zm5.2 2.5 1-1.6-1.9-1.3-1 1.6 1.9 1.3zm5.2 1.9 1-1.6-1.9-1.2-1 1.6 1.9 1.2z" /></svg>
);
export const IconEye = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}><path d="M12 5c5 0 9.3 3 11 7-1.7 4-6 7-11 7S2.7 16 1 12c1.7-4 6-7 11-7zm0 2C8.2 7 4.8 8.9 3.2 12 4.8 15.1 8.2 17 12 17s7.2-1.9 8.8-5C19.2 8.9 15.8 7 12 7zm0 1.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zm0 2a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" /></svg>
);
export const IconMenu = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}><path d="M3.5 6h17a1 1 0 1 0 0-2h-17a1 1 0 1 0 0 2zm17 5h-17a1 1 0 1 0 0 2h17a1 1 0 1 0 0-2zm0 7h-17a1 1 0 1 0 0 2h17a1 1 0 1 0 0-2z" /></svg>
);
export const IconArrowLeft = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}><path d="M20 11H7.8l4.6-4.6A1.2 1.2 0 1 0 10.7 4.7l-6.2 6.2a1.2 1.2 0 0 0 0 1.7l6.2 6.2a1.2 1.2 0 1 0 1.7-1.7L7.8 13H20a1 1 0 1 0 0-2z" /></svg>
);
export const IconPause = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}><path d="M7 4.5A1.5 1.5 0 0 1 8.5 3h1A1.5 1.5 0 0 1 11 4.5v15A1.5 1.5 0 0 1 9.5 21h-1A1.5 1.5 0 0 1 7 19.5v-15zm6 0A1.5 1.5 0 0 1 14.5 3h1A1.5 1.5 0 0 1 17 4.5v15a1.5 1.5 0 0 1-1.5 1.5h-1A1.5 1.5 0 0 1 13 19.5v-15z" /></svg>
);
export const IconPersonCircle = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}><path fillRule="evenodd" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16zm0 3.4a2.9 2.9 0 1 1 0 5.8 2.9 2.9 0 0 1 0-5.8zM6.6 18.6c.8-2.3 2.9-3.6 5.4-3.6s4.6 1.3 5.4 3.6a8 8 0 0 1-10.8 0z" /></svg>
);
export const IconFlag = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}><path d="M6 21V4a1 1 0 0 1 1.7-.7l1 1.2A6 6 0 0 0 13 6c1.5 0 2.6-.5 4-1.3a1 1 0 0 1 1.5.9v7.3a1 1 0 0 1-.5.9c-1.6.9-3 1.4-5 1.4a6 6 0 0 1-4.3-1.5L8 15.4V21a1 1 0 1 1-2 0z" /></svg>
);
export const IconNews = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}><path d="M5 4h11a2 2 0 0 1 2 2v12a1 1 0 0 0 2 0V8h1a1 1 0 1 1 0 2h-1v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a2 2 0 0 1 2-2zm3 4.5A1.5 1.5 0 0 1 9.5 7h5A1.5 1.5 0 0 1 16 8.5v2A1.5 1.5 0 0 1 14.5 12h-5A1.5 1.5 0 0 1 8 10.5v-2zM7.5 15h6a1 1 0 1 1 0 2h-6a1 1 0 1 1 0-2z" /></svg>
);
export const IconCoin = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}><path fillRule="evenodd" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16zm-.3 3.6a.9.9 0 0 1 1.7.5l.2.7a4.4 4.4 0 0 1 1.7 1.2.9.9 0 1 1-1.3 1.3 2.6 2.6 0 0 0-2-.8c-1 0-1.7.5-1.7 1.3 0 .7.4 1 1.5 1.3l1 .3c1.7.5 2.6 1.4 2.6 2.8 0 1.5-1 2.6-2.5 3l-.2.8a.9.9 0 1 1-1.8 0l-.2-.7a4.6 4.6 0 0 1-2-1.4.9.9 0 1 1 1.4-1.2c.5.6 1.2 1 2 1 1 0 1.8-.6 1.8-1.4 0-.7-.5-1.1-1.6-1.4l-1-.3c-1.6-.5-2.5-1.4-2.5-2.7 0-1.5 1-2.6 2.5-3l.2-.7z" /></svg>
);
export const IconChat = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}><path d="M12 3C6.5 3 2 6.9 2 11.8c0 2.8 1.5 5.3 3.8 6.9-.1 1-.5 2.1-1.3 3.1-.2.3 0 .7.4.6 2-.3 3.6-1.1 4.7-1.9.8.2 1.6.3 2.4.3 5.5 0 10-3.9 10-8.8S17.5 3 12 3zm-3.6 10.2-2.3-2.4a.6.6 0 0 1 .8-.9l1.9 1.6 3-3.2a.6.6 0 0 1 .9 0l2.3 2.4a.6.6 0 0 1-.8.9l-1.9-1.6-3 3.2a.6.6 0 0 1-.9 0z" /></svg>
);
export const IconShield = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}><path d="M12 2.5 4.5 5v6c0 4.9 3.2 8.6 7.5 10.5 4.3-1.9 7.5-5.6 7.5-10.5V5L12 2.5zm3.2 7.2-4.1 4.6a1 1 0 0 1-1.5 0l-2-2.2a1 1 0 1 1 1.5-1.3l1.2 1.4 3.3-3.8a1 1 0 1 1 1.6 1.3z" /></svg>
);
export const IconGear = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}><path d="M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5zm9 4.6v-2.2l-2.4-.5a7.4 7.4 0 0 0-.8-1.9l1.3-2.1-1.6-1.6-2.1 1.3a7.4 7.4 0 0 0-1.9-.8L13 .9h-2l-.5 2.4a7.4 7.4 0 0 0-1.9.8L6.5 2.8 4.9 4.4l1.3 2.1a7.4 7.4 0 0 0-.8 1.9L3 10.9v2.2l2.4.5c.2.7.5 1.3.8 1.9l-1.3 2.1 1.6 1.6 2.1-1.3c.6.3 1.2.6 1.9.8L11 23.1h2l.5-2.4a7.4 7.4 0 0 0 1.9-.8l2.1 1.3 1.6-1.6-1.3-2.1c.3-.6.6-1.2.8-1.9l2.4-.5z" transform="scale(0.92) translate(1,1)" /></svg>
);
