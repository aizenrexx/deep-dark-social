// Watcher client state helpers (localStorage). Keys are shared across
// the app shell, friends page, reels and (later) profile Watch buttons.
const FOLLOWS_KEY = "dds-follows-v1";
const SAVES_KEY = "dds-saves-v1";
const LOVES_KEY = "dds-loves-v1";
const NOTIF_SEEN_KEY = "dds-notif-seen-v1";

function readSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch { return new Set(); }
}
function writeSet(key: string, set: Set<string>) {
  try { localStorage.setItem(key, JSON.stringify([...set])); } catch {}
}
export const getFollows = () => readSet(FOLLOWS_KEY);
export const isFollowing = (id: string) => readSet(FOLLOWS_KEY).has(id);
export function toggleFollow(id: string): boolean {
  const s = readSet(FOLLOWS_KEY);
  const on = !s.has(id);
  if (on) s.add(id); else s.delete(id);
  writeSet(FOLLOWS_KEY, s);
  return on;
}
export const getSaves = () => readSet(SAVES_KEY);
export function toggleSave(id: string): boolean {
  const s = readSet(SAVES_KEY);
  const on = !s.has(id);
  if (on) s.add(id); else s.delete(id);
  writeSet(SAVES_KEY, s);
  return on;
}
export const getLoves = () => readSet(LOVES_KEY);
export function toggleLove(id: string): boolean {
  const s = readSet(LOVES_KEY);
  const on = !s.has(id);
  if (on) s.add(id); else s.delete(id);
  writeSet(LOVES_KEY, s);
  return on;
}
export const getNotifSeen = () => readSet(NOTIF_SEEN_KEY);
export function markNotifSeen(ids: (string | number)[]) {
  const s = readSet(NOTIF_SEEN_KEY);
  ids.forEach((i) => s.add(String(i)));
  writeSet(NOTIF_SEEN_KEY, s);
}
