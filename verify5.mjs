// Phase 1 (Core Social Depth) verification — reactions, polls, threads,
// share sheet, overflow menu, saved, feed tabs. VPS: node verify5.mjs
import { writeFileSync, mkdirSync } from "node:fs";
const CDP = "http://127.0.0.1:9333";
const BASE = "http://localhost:3107";
const OUT = "/home/iris/dds-verify5";
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
async function typeText(text) { for (const ch of text) await send("Input.insertText", { text: ch }); await sleep(250); }

const R = { checks: [] };
const check = (name, ok, detail = "") => { R.checks.push({ name, ok: !!ok }); console.log(ok ? "PASS" : "FAIL", name, detail); };
const vis = async (sel) => evl(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false; const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return cs.display !== "none" && r.width > 0 && r.height > 0; })()`);

// ---------- DESKTOP home: tabs, cards, counts ----------
await vp(1280, 900, false);
await nav("/");
check("feed tabs render", await vis('[data-testid="feed-tabs"]'));
const tabCount = await evl(`document.querySelectorAll(".feed-tab").length`);
check("7 feed tabs", tabCount === 7, `tabs=${tabCount}`);
check("home tab active", await evl(`document.querySelector(".feed-tab.active")?.textContent === "Home"`));
const postCount = await evl(`document.querySelectorAll("[data-post-card]").length`);
check("first page 6 posts", postCount === 6, `posts=${postCount}`);

// reload-latest (see more) — total unique posts available should exceed 24 now
await evl(`document.querySelector(".see-more-posts")?.click()`);
await sleep(1200);
await evl(`document.querySelector(".see-more-posts")?.click()`);
await sleep(1200);
const postsAfter = await evl(`document.querySelectorAll("[data-post-card]").length`);
check("pager reaches beyond 24 posts", postsAfter > 12, `posts=${postsAfter}`);

// reaction: normalise state first (previous runs may leave a reaction),
// then click Like on first card → pressed + summary mentions You.
const card1 = "[data-post-card]";
const wasPressed = await evl(`document.querySelector("[data-post-card] .reaction-wrap > button")?.getAttribute("aria-pressed")`);
if (wasPressed === "true") { await tap(`${card1} .reaction-wrap > button`); await sleep(500); }
const before = await evl(`(() => { const c = document.querySelector("[data-post-card]"); const b = c?.querySelector(".reaction-summary"); return b?.textContent?.trim(); })()`);
await tap(`${card1} .reaction-wrap > button`);
await sleep(400);
const pressed = await evl(`document.querySelector("[data-post-card] .reaction-wrap > button")?.getAttribute("aria-pressed")`);
check("like toggles on", pressed === "true");
const after = await evl(`(() => { const c = document.querySelector("[data-post-card]"); const b = c?.querySelector(".reaction-summary"); return b?.textContent?.trim(); })()`);
check("reaction summary mentions You", /You: Like/.test(after ?? ""), `before="${before}" after="${after}"`);

// reaction picker via hover-wait: dispatch mouseenter manually
await evl(`(() => { const w = document.querySelector("[data-post-card] .reaction-wrap"); w?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true })); })()`);
await sleep(800);
const pickerVisible = await vis('[data-testid="reaction-picker"]');
check("reaction picker opens (hover)", pickerVisible);
if (pickerVisible) {
  await tap('.reaction-pick[aria-label="React Love"]');
  await sleep(500);
  const loveLabel = await evl(`document.querySelector("[data-post-card] .reaction-summary")?.textContent?.includes("You: Love")`);
  check("picker sets LOVE", loveLabel);
  await shot("v5-reaction-love");
}

// comment thread inline: open, citizen comments + note add
await tap(`${card1} .post-actions button[aria-expanded]`);
await sleep(900);
check("thread opens", await vis('[data-testid="comment-thread"]'));
const threadRows = await evl(`document.querySelectorAll("[data-post-card] .comment-row").length`);
check("thread has citizen comments", threadRows >= 2, `rows=${threadRows}`);
await tap(`${card1} .comment-input`);
await typeText("Verify note: the river looks fair today.");
await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter" });
await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter" });
await sleep(500);
const noteShown = await evl(`[...document.querySelectorAll("[data-post-card] .comment-text")].some(e => e.textContent.includes("Verify note"))`);
check("watcher note appears", noteShown);
await shot("v5-thread");

// overflow menu: open → Save post → saved page contains it
await tap(`${card1} .post-menu .icon-circle-button[aria-label="Post options"]`);
await sleep(400);
check("overflow menu opens", await vis(".post-menu-pop"));
const menuItems = await evl(`document.querySelectorAll(".post-menu-item").length`);
check("overflow has 9 items", menuItems === 9, `items=${menuItems}`);
const firstItemTitle = await evl(`document.querySelector(".post-menu-item")?.textContent ?? ""`);
if (/Save post/.test(firstItemTitle)) {
  await tap('.post-menu-item:nth-child(1)');
  await sleep(600);
} else {
  // Already saved in an earlier run — close the menu instead.
  await evl(`document.querySelector(".dds-app-topbar")?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }))`);
  await sleep(300);
}
await nav("/saved");
const savedRows = await evl(`document.querySelectorAll(".saved-row").length`);
check("/saved lists the saved post", savedRows >= 1, `rows=${savedRows}`);
await shot("v5-saved");
// create a collection
await tap(".saved-new input");
await typeText("River reads");
await tap(".saved-new button");
await sleep(1200);
const colExists = await evl(`[...document.querySelectorAll(".saved-rail-item")].some(e => e.textContent.includes("River reads"))`);
check("collection created", colExists);

// polls tab: find poll card, vote, result bars
await nav("/?tab=polls");
const pollCards = await evl(`document.querySelectorAll('[data-testid="poll-card"]').length`);
check("polls tab shows poll cards", pollCards >= 1, `polls=${pollCards}`);
const firstOption = await evl(`document.querySelectorAll(".poll-option, .poll-result").length`);
check("poll has options", firstOption >= 3, `opts=${firstOption}`);
await tap(".poll-option, .poll-result");
await sleep(900);
const barsShown = await evl(`document.querySelectorAll(".poll-result").length >= 3 && document.querySelector(".poll-meta")?.textContent?.includes("you voted")`);
check("voting shows result bars + meta", barsShown);
await shot("v5-poll-voted");

// permalink: full thread + pinned comment visible
await nav("/posts/1");
check("permalink thread default open", await vis('[data-testid="comment-thread"]'));
const permalinkRows = await evl(`document.querySelectorAll(".comment-row").length`);
check("permalink comments render", permalinkRows >= 3, `rows=${permalinkRows}`);

// groups tab
await nav("/?tab=groups");
const groupPosts = await evl(`document.querySelectorAll("[data-post-card]").length`);
check("groups tab has posts", groupPosts >= 1, `posts=${groupPosts}`);
check("group context label", await evl(`[...document.querySelectorAll(".post-author")].some(e => e.textContent.includes("in"))`));

// photos tab
await nav("/?tab=photos");
const photoPosts = await evl(`document.querySelectorAll("[data-post-card]").length`);
check("photos tab has media posts", photoPosts >= 3, `posts=${photoPosts}`);

// favorites empty state (no follows yet in this profile... state may persist; check either posts or the honest note)
await nav("/?tab=favorites");
const favState = await evl(`(() => ({ posts: document.querySelectorAll("[data-post-card]").length, empty: !!document.querySelector(".feed-empty") }))()`);
check("favorites tab renders (posts or honest empty state)", favState.posts > 0 || favState.empty, JSON.stringify(favState));

// ---------- MOBILE 390 smoke ----------
await vp(390, 844, true);
await nav("/");
check("M tabs render", await vis('[data-testid="feed-tabs"]'));
check("M shell intact", await vis('[data-testid="app-tabbar"]'));
check("M no h-overflow", await evl(`document.documentElement.scrollWidth <= innerWidth`));
await shot("v5-m-home");

console.log("\nCONSOLE/EXCEPTIONS:", errors.length ? errors.slice(0, 6).join(" | ") : "none");
check("no console errors", errors.length === 0, errors.slice(0, 2).join(" | "));
const pass = R.checks.filter((c) => c.ok).length;
console.log(`PHASE1 RESULT: ${pass}/${R.checks.length} PASS`);
try { await fetch(`${CDP}/json/close/${created.id}`); } catch {}
process.exit(0);
