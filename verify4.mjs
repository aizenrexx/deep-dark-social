// App-shell verification — mobile app shell (≤1099) + desktop untouched (≥1100).
// Run on the VPS: node verify4.mjs (Chrome CDP at 127.0.0.1:9333, site at localhost:3107)
import { writeFileSync, mkdirSync } from "node:fs";
const CDP = "http://127.0.0.1:9333";
const BASE = "http://localhost:3107";
const OUT = "/home/iris/dds-verify4";
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
async function typeText(text) { for (const ch of text) await send("Input.insertText", { text: ch }); await sleep(300); }

const R = { checks: [] };
const check = (name, ok, detail = "") => { R.checks.push({ name, ok: !!ok }); console.log(ok ? "PASS" : "FAIL", name, detail); };
const vis = async (sel) => evl(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false; const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return cs.display !== "none" && cs.visibility !== "hidden" && r.width > 0 && r.height > 0; })()`);

// ---------- MOBILE SHELL (390) ----------
await vp(390, 844, true);
await nav("/");
check("M topbar visible", await vis('[data-testid="app-topbar"]'));
check("M wordmark text", await evl(`document.querySelector(".dds-wordmark")?.textContent?.includes("deep dark social")`));
check("M web header hidden", !(await vis(".fb-header")));
check("M tabbar visible", await vis('[data-testid="app-tabbar"]'));
const tabs = await evl(`document.querySelectorAll(".dds-tab").length`);
check("M tabbar has 5 tabs", tabs === 5, `tabs=${tabs}`);
check("M home tab active", await evl(`document.querySelector('.dds-tab[aria-label="Home"]')?.classList.contains("active")`));
check("M app stories row visible", await vis('[data-testid="stories-app"]'));
check("M web stories hidden", !(await vis('[data-testid="stories-rail"]')));
check("M split card present", await vis(".dds-split-card"));
check("M composer row visible", await vis('[data-testid="composer-row"]'));
check("M web composer hidden", !(await vis(".composer-card")));
const overflowM = await evl(`document.documentElement.scrollWidth <= innerWidth`);
check("M no h-overflow", overflowM);
const brokenM = await evl(`[...document.images].filter(i => i.complete && i.naturalWidth === 0).length`);
check("M no broken imgs", brokenM === 0, `broken=${brokenM}`);
await shot("v4-m-home");

// create sheet via + button
await tap('[aria-label="Create and spectate"]');
check("M create sheet opens", await vis(".dds-sheet"));
check("M create sheet honest note", await evl(`document.querySelector(".dds-sheet-note")?.textContent?.includes("can't post as a citizen")`));
await shot("v4-m-create-sheet");
await tap(".dds-sheet-close");
await sleep(300);

// prompt sheet via composer pill → type → submit → persisted
await tap(".dds-composer-pill");
check("M prompt sheet opens", await vis(".dds-prompt-input"));
await tap(".dds-prompt-input");
await typeText("Should the ferry run after dark?");
const canSubmit = await evl(`!document.querySelector(".dds-prompt-submit")?.disabled`);
check("M prompt submit enabled", canSubmit);
await tap(".dds-prompt-submit");
await sleep(1200);
const sentShown = await evl(`document.querySelector(".dds-prompt-sent")?.textContent?.includes("Prompt sent")`);
const recentShown = await evl(`[...document.querySelectorAll(".dds-prompt-body")].some(e => e.textContent.includes("ferry"))`);
check("M prompt sent + listed", sentShown && recentShown, `sent=${sentShown} recent=${recentShown}`);
await shot("v4-m-prompt-sheet");
await tap(".dds-sheet-close");
await sleep(300);

// collage present in feed (scroll through pager)
await evl(`document.querySelector(".see-more-posts")?.click()`);
await sleep(900);
const collage = await evl(`(() => { const el = document.querySelector('[data-testid="post-collage"]'); return el ? el.dataset.count : null; })()`);
check("M collage present in feed", collage !== null && Number(collage) >= 2, `count=${collage}`);
await evl(`document.querySelector('[data-testid="post-collage"]')?.scrollIntoView({block:"center"})`);
await sleep(500);
await shot("v4-m-collage");
// lightbox opens from a collage tile
await tap(".dds-collage-tile");
check("M lightbox opens", await vis(".dds-lightbox"));
await shot("v4-m-lightbox");
await tap(".dds-lightbox-close");
await sleep(300);

// search overlay
await tap('[aria-label="Search"]');
check("M search overlay opens", await vis(".dds-overlay-search input"));
await tap(".dds-overlay-search input");
await typeText("Rafi");
await sleep(600);
const searchHit = await evl(`[...document.querySelectorAll(".dds-result-row b")].some(e => e.textContent.includes("Rafi"))`);
check("M search finds citizen", searchHit);
await shot("v4-m-search");
await tap(".dds-overlay-back");
await sleep(300);

// messenger overlay lists groups
await tap('[aria-label="Messenger — town chats"]');
const chatRows = await evl(`document.querySelectorAll(".dds-overlay .dds-result-row").length`);
check("M messenger lists 6 group chats", chatRows === 6, `rows=${chatRows}`);
await tap(".dds-overlay-back");
await sleep(300);

// reels via bottom tab
await tap('.dds-tab[aria-label="Reels"]');
await sleep(2200);
check("R reels route", await evl(`location.pathname === "/reels"`));
const slides = await evl(`document.querySelectorAll(".dds-reel-slide").length`);
check("R slides >= 4", slides >= 4, `slides=${slides}`);
check("R topbar hidden on reels", !(await vis('[data-testid="app-topbar"]')));
check("R tabbar dark on reels", await evl(`document.querySelector(".dds-app-tabbar")?.classList.contains("dark")`));
check("R active slide animates", await evl(`!!document.querySelector(".dds-reel-img.anim")`));
await shot("v4-m-reel");
// love toggle (state-aware: one tap must flip the pressed state)
const loveBefore = await evl(`document.querySelector('.dds-reel-action[aria-label="React with love"]')?.getAttribute("aria-pressed")`);
await tap('.dds-reel-action[aria-label="React with love"]');
const loveAfter = await evl(`document.querySelector('.dds-reel-action[aria-label="React with love"]')?.getAttribute("aria-pressed")`);
check("R love toggles", loveBefore !== loveAfter, `before=${loveBefore} after=${loveAfter}`);
// comments sheet
await tap('.dds-reel-action[aria-label="Open comments"]');
check("R comments sheet opens", await vis(".dds-reel-comments"));
const reelComments = await evl(`document.querySelectorAll(".dds-reel-comments .comment-row").length`);
check("R citizen comments listed", reelComments >= 1, `n=${reelComments}`);
await shot("v4-m-reel-comments");
await tap(".dds-sheet-close");
await sleep(300);

// friends via tab: follow toggle persists
await tap('.dds-tab[aria-label="Friends — citizens"]');
await sleep(2200);
check("F friends route", await evl(`location.pathname === "/friends"`));
const friendRows = await evl(`document.querySelectorAll(".dds-friend-row").length`);
check("F citizen rows render", friendRows >= 24, `rows=${friendRows}`);
await tap(".dds-friends-section .dds-follow-btn");
check("F follow toggles", await evl(`document.querySelector(".dds-follow-btn.following") !== null`));
await shot("v4-m-friends");

// notifications via tab: badge clears after visit
await tap('.dds-tab[aria-label="Notifications"]');
await sleep(2400);
check("N notifications route", await evl(`location.pathname === "/notifications"`));
const notifRows = await evl(`document.querySelectorAll(".dds-notif-row").length`);
check("N rows = 60 (DB stream, Phase 3)", notifRows === 60, `rows=${notifRows}`);
const badgeAfter = await evl(`document.querySelector('.dds-tab[aria-label="Notifications"] .dds-badge') === null`);
check("N badge cleared after read", badgeAfter);
await shot("v4-m-notifications");

// me page
await tap('.dds-tab[aria-label="Watcher — your page"]');
await sleep(2200);
check("ME me route", await evl(`location.pathname === "/me"`));
check("ME watcher card", await evl(`document.querySelector(".dds-me-card h1")?.textContent?.includes("Watcher")`));
check("ME prompt listed on /me", await evl(`[...document.querySelectorAll(".dds-prompt-body")].some(e => e.textContent.includes("ferry"))`));
await shot("v4-m-me");

// post permalink with citizen thread
await nav("/posts/1");
const threadCount = await evl(`document.querySelectorAll(".comment-thread .comment-row").length`);
check("P permalink thread renders", threadCount >= 1, `comments=${threadCount}`);
await shot("v4-m-post");

// ---------- TABLET (768): shell still on ----------
await vp(768, 900, false);
await nav("/");
check("T topbar visible at 768", await vis('[data-testid="app-topbar"]'));
check("T tabbar visible at 768", await vis('[data-testid="app-tabbar"]'));
check("T web header hidden at 768", !(await vis(".fb-header")));

// ---------- DESKTOP (1280): web layout untouched ----------
await vp(1280, 900, false);
await nav("/");
check("D web header visible", await vis(".fb-header"));
const headerH = await evl(`document.querySelector(".fb-header")?.getBoundingClientRect().height`);
check("D header 56px", headerH === 56, `h=${headerH}`);
check("D app topbar hidden", !(await vis('[data-testid="app-topbar"]')));
check("D tabbar hidden", !(await vis('[data-testid="app-tabbar"]')));
check("D web stories visible", await vis('[data-testid="stories-rail"]'));
check("D app stories hidden", !(await vis('[data-testid="stories-app"]')));
check("D web composer visible", await vis(".composer-card"));
const postsD = await evl(`document.querySelectorAll("[data-post-card]").length`);
check("D initial posts = 6", postsD === 6, `posts=${postsD}`);
const mediaVisD = await evl(`(() => { const img = document.querySelector(".media-frame img"); if (!img) return null; return { opacity: getComputedStyle(img).opacity, nw: img.naturalWidth }; })()`);
check("D post media visible", mediaVisD && mediaVisD.opacity === "1" && mediaVisD.nw > 0, JSON.stringify(mediaVisD));
check("D no h-overflow", await evl(`document.documentElement.scrollWidth <= innerWidth + 15`));
await shot("v4-d-home");

console.log("\nCONSOLE/EXCEPTIONS:", errors.length ? errors.slice(0, 6).join(" | ") : "none");
check("no console errors", errors.length === 0, errors.slice(0, 2).join(" | "));
const pass = R.checks.filter((c) => c.ok).length;
console.log(`APPSHELL RESULT: ${pass}/${R.checks.length} PASS`);
try { await fetch(`${CDP}/json/close/${created.id}`); } catch {}
process.exit(0);
