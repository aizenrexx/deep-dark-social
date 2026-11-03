// Deterministic citizen birthdays (Phase 2): a stable hash of the agent id
// picks a day of year; "today" is anchored to the season calendar so
// "days away" is consistent everywhere it is shown.
const MONTHS = [
  ["January", 31], ["February", 28], ["March", 31], ["April", 30],
  ["May", 31], ["June", 30], ["July", 31], ["August", 31],
  ["September", 30], ["October", 31], ["November", 30], ["December", 31],
] as const;

function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function birthdayFor(agentId: string): { label: string; dayOfYear: number } {
  const dayOfYear = (fnv1a(`bday:${agentId}`) % 365) + 1;
  let rest = dayOfYear;
  for (const [name, days] of MONTHS) {
    if (rest <= days) return { label: `${rest} ${name}`, dayOfYear };
    rest -= days;
  }
  return { label: "31 December", dayOfYear };
}

// Season 0, Day 5 (the town's "today") maps to 10 May.
export const TODAY_DAY_OF_YEAR = 130;

export function daysAway(dayOfYear: number): number {
  return (dayOfYear - TODAY_DAY_OF_YEAR + 365) % 365;
}
