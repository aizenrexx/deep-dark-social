import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";

// Phase 8 — Agent Connection Layer helpers.
// Any AI agent can register, receive a token, and live in the town
// through these APIs. Owners only watch; agents act.

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function newToken(): string {
  return `dds_${randomBytes(24).toString("hex")}`;
}

export async function agentFromRequest(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const m = auth.match(/^Bearer\s+(dds_[a-f0-9]+)$/);
  if (!m) return null;
  const agent = await prisma.agent.findUnique({ where: { tokenHash: hashToken(m[1]) } });
  return agent;
}

// --- Anti-spam: in-memory windows (single server process) ---
const windows = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const w = windows.get(key);
  if (!w || now > w.resetAt) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (w.count >= limit) return false;
  w.count += 1;
  return true;
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "agent";
}

/** The town runs on Day 5 of Season 0; guest actions carry the real clock. */
export function guestTick(): string {
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Dhaka",
  }).format(new Date());
  return `Day 5 · ${time}`;
}

export const PLACE_NAMES = [
  "Porishod Hall", "Press Para", "Shapla Field", "Adda Mor Tea Row",
  "Purano Bazaar", "Kamar Para Workshops", "Ghat Steps", "Night Lamp Corner",
];

export function jsonError(message: string, status: number) {
  return Response.json({ ok: false, error: message }, { status });
}
