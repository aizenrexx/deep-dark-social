// Phase 2 (Identity & Relationships) verification. VPS: node verify6.mjs
import { writeFileSync, mkdirSync } from "node:fs";
const CDP = "http://127.0.0.1:9333";
const BASE = "http://localhost:3107";
const OUT = "/home/iris/dds-verify6";
mkdirSync(OUT, { recursive: true });

const created = await (await fetch(`${CDP}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(created.webSocketDebuggerUrl);
let id = 0; const pending = new Map(); const errors = [];
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errors.push("console: " + JSON.stringify(m.params.args?.[0]?.value ?? "").slice(0, 120));
  if (m.method === "Runtime.exceptionThrown") errors.push("exception: " + (m.params.exceptionDetails?.text ?? "").slice(0, 120));
};
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
await new Promise((r) => (ws.onopen = r));
await send("Page.enable"); await send("Runtime.enable");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function evl(expr) { const o = await send("Runtime.evaluate", { expression: expr, returnByValue: true }); return o.result?.result?.value; }
async function shot(name) { const s = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }); if (s.result?.data) writeFileSync(`${OUT}/${name}.png`, Buffer.from(s.result.data, "base64")); }
async function vp(w, h, mobile) { await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile }); }
async function nav(path, wait = 2600) { await send("Page.navigate", { url: BASE + path }); await sleep(wait); await evl("scrollTo(0,0)"); await sleep(250); }
async function tap(sel) {
  const exists = await evl(`!!document.querySelector(${JSON.stringify(sel)})`);
  if (!exists) return false;
  await evl(`document.querySelector(${JSON.stringify(sel)})?.scrollIntoView({block:"center"})`);
  let pt = null;
  for (let i = 0; i < 7; i++) {
    const cur = await evl(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.left + r.width/2, y: r.top + r.height/2 }; })()`);
    if (!cur) return false;
    if (pt && Math.abs(cur.x - pt.x) < 1 && Math.abs(cur.y - pt.y) < 1) { pt = cur; break; }
    pt = cur;
    await sleep(300);
  }
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: pt.x, y: pt.y, button: "left", buttons: 1, clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: pt.x, y: pt.y, button: "left", buttons: 0, clickCount: 1 });
  await sleep(650);
  return true;
}

const R = { checks: [] };
const check = (name, ok, detail = "") => { R.checks.push({ name, ok: !!ok }); console.log(ok ? "PASS" : "FAIL", name, detail); };
const vis = async (sel) => evl(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false; const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return cs.display !== "none" && r.width > 0 && r.height > 0; })()`);

await vp(1280, 900, false);

// Profile: hero + tabs
await nav("/agents/rafi-karim");
const tabLinks = await evl(`document.querySelectorAll('[data-testid="profile-tabs"] a').length`);
check("profile has 9 tabs (Events added Phase 5)", tabLinks === 9, `tabs=${tabLinks}`);
check("hero shows friend count", await evl(`document.querySelector(".profile-social-line")?.textContent?.includes("friends")`));
check("no dead Watch button", await evl(`![...document.querySelectorAll("button")].some(b => b.textContent.trim() === "Watch")`));
check("Message opens conversations (Phase 5)", await evl(`(() => { const a = [...document.querySelectorAll("a")].find(b => b.textContent.trim() === "Message"); return a?.getAttribute("href")?.startsWith("/messenger?citizen="); })()`));

// Follow toggle on profile (state-aware)
const followBtn = ".profile-actions .primary-action, .profile-actions .secondary-action[aria-pressed]";
const pressedBefore = await evl(`document.querySelector(".profile-actions button[aria-pressed]")?.getAttribute("aria-pressed")`);
await tap(".profile-actions button[aria-pressed]");
await sleep(500);
const pressedAfter = await evl(`document.querySelector(".profile-actions button[aria-pressed]")?.getAttribute("aria-pressed")`);
check("profile follow toggles", pressedBefore !== pressedAfter, `${pressedBefore} -> ${pressedAfter}`);
await shot("v6-profile");

// About tab
await nav("/agents/rafi-karim?tab=about");
const aboutRows = await evl(`document.querySelectorAll(".about-row").length`);
check("about rows render", aboutRows >= 6, `rows=${aboutRows}`);
const lifeEvents = await evl(`document.querySelectorAll(".life-events li").length`);
check("life events = 4", lifeEvents === 4, `n=${lifeEvents}`);
check("about shows birthday", await evl(`document.body.textContent.includes("Birthday")`));

// Friends tab
await nav("/agents/rafi-karim?tab=friends");
const friendCards = await evl(`document.querySelectorAll(".friend-card").length`);
check("friends grid populated", friendCards >= 4, `cards=${friendCards}`);
check("mutual counts shown", await evl(`document.body.textContent.includes("mutual")`));
await shot("v6-friends-tab");

// Photos tab + lightbox
await nav("/agents/rafi-karim?tab=photos");
const tiles = await evl(`document.querySelectorAll(".photo-tile").length`);
check("photos grid tiles", tiles === 4, `tiles=${tiles}`);
await tap(".photo-tile");
check("photo lightbox opens", await vis(".dds-lightbox"));
await shot("v6-photo-lightbox");
await tap(".dds-lightbox-close");
await sleep(300);

// Videos tab
await nav("/agents/rafi-karim?tab=videos");
const videoCards = await evl(`document.querySelectorAll(".video-card").length`);
check("videos tab has scene cards", videoCards >= 1, `cards=${videoCards}`);

// Groups tab
await nav("/agents/rafi-karim?tab=groups");
const groupRows = await evl(`document.querySelectorAll(".profile-group-row").length`);
check("groups tab rows", groupRows >= 1, `rows=${groupRows}`);

// Likes tab
await nav("/agents/rafi-karim?tab=likes");
const likeRows = await evl(`document.querySelectorAll(".likes-row").length`);
check("likes tab rows", likeRows >= 3, `rows=${likeRows}`);

// Stories tab
await nav("/agents/rafi-karim?tab=stories");
const archiveCards = await evl(`document.querySelectorAll(".story-archive-card").length`);
check("story archive = 4", archiveCards === 4, `cards=${archiveCards}`);
check("story view counts", await evl(`document.body.textContent.includes("seen by")`));
check("highlight chip", await evl(`document.querySelectorAll(".highlight-chip").length >= 1`));
await shot("v6-stories-tab");

// /friends town social sections
await nav("/friends");
check("birthdays strip", await evl(`document.querySelectorAll(".town-birthday").length === 3`));
check("town requests section", await evl(`document.body.textContent.includes("Friend requests in town")`));
check("pairs section", await evl(`document.body.textContent.includes("not friends yet")`));
await shot("v6-friends-page");

// Mobile profile smoke
await vp(390, 844, true);
await nav("/agents/rafi-karim?tab=friends");
check("M friends tab renders", await vis('[data-testid="friends-grid"]'));
check("M no h-overflow", await evl(`document.documentElement.scrollWidth <= innerWidth`));

console.log("\nCONSOLE/EXCEPTIONS:", errors.length ? errors.slice(0, 6).join(" | ") : "none");
check("no console errors", errors.length === 0, errors.slice(0, 2).join(" | "));
const pass = R.checks.filter((c) => c.ok).length;
console.log(`PHASE2 RESULT: ${pass}/${R.checks.length} PASS`);
try { await fetch(`${CDP}/json/close/${created.id}`); } catch {}
process.exit(0);
