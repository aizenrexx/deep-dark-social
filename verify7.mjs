// Phase 3 (Discovery) verification. VPS: node verify7.mjs
import { writeFileSync, mkdirSync } from "node:fs";
const CDP = "http://127.0.0.1:9333";
const BASE = "http://localhost:3107";
const OUT = "/home/iris/dds-verify7";
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

await vp(1280, 900, false);

// Search
await nav("/search");
check("trending chips on search home", await evl(`document.querySelectorAll(".search-recent-chip").length >= 3`));
await nav("/search?q=ferry");
check("search results count line", await evl(`document.body.textContent.includes("results for")`));
const citizenHits = await evl(`document.querySelectorAll(".search-section").length`);
check("search sections render", citizenHits >= 1, `sections=${citizenHits}`);
await nav("/search?q=Rafi");
check("citizen search finds Rafi", await evl(`[...document.querySelectorAll(".dds-result-row b")].some(e => e.textContent.includes("Rafi"))`));
await shot("v7-search");

// Hashtags
await nav("/");
const tagChips = await evl(`document.querySelectorAll(".post-tag").length`);
check("post cards show hashtag chips", tagChips >= 2, `chips=${tagChips}`);
const firstTag = await evl(`document.querySelector(".post-tag")?.getAttribute("href")`);
await nav(firstTag || "/hashtag/FerryWatch");
const hashPosts = await evl(`document.querySelectorAll("[data-post-card]").length`);
check("hashtag page lists posts", hashPosts >= 1, `posts=${hashPosts}`);
check("hashtag header honest counts", await evl(`document.body.textContent.includes("citizens talking")`));
await shot("v7-hashtag");

// Pages
await nav("/pages");
const pageCards = await evl(`document.querySelectorAll(".page-card").length`);
check("pages directory = 12", pageCards === 12, `cards=${pageCards}`);
await nav("/pages/kori-treasury");
const reviews = await evl(`document.querySelectorAll(".review-row").length`);
check("page reviews render", reviews >= 4, `reviews=${reviews}`);
check("page hero about", await evl(`document.body.textContent.includes("public ledger")`));
const followBefore = await evl(`document.querySelector(".page-actions-row button[aria-pressed]")?.getAttribute("aria-pressed")`);
await tap(".page-actions-row button[aria-pressed]");
await sleep(500);
const followAfter = await evl(`document.querySelector(".page-actions-row button[aria-pressed]")?.getAttribute("aria-pressed")`);
check("page follow toggles", followBefore !== followAfter, `${followBefore} -> ${followAfter}`);
await shot("v7-page");

// Feed Pages tab now has posts (a page at Porishod Hall followed) or honest note
await nav("/?tab=pages");
const pagesTabPosts = await evl(`document.querySelectorAll("[data-post-card]").length`);
const pagesTabNote = await evl(`!!document.querySelector(".feed-empty")`);
check("pages feed tab works", pagesTabPosts >= 1 || pagesTabNote, `posts=${pagesTabPosts}`);
check("7 feed tabs now", await evl(`document.querySelectorAll(".feed-tab").length === 7`));

// Places
await nav("/places");
const placeCards = await evl(`document.querySelectorAll(".page-card").length`);
check("places index = 8", placeCards === 8, `cards=${placeCards}`);
await nav("/places/ghat-steps");
const placePosts = await evl(`document.querySelectorAll("[data-post-card]").length`);
check("place detail posts", placePosts >= 1, `posts=${placePosts}`);
check("place voices", await evl(`document.querySelectorAll(".voice-chip").length >= 2`));

// News + Oracle
await nav("/news");
const articles = await evl(`document.querySelectorAll(".news-card").length`);
check("news articles = 24", articles === 24, `n=${articles}`);
await nav("/oracle");
check("oracle record line", await evl(`document.body.textContent.includes("hits in")`));
const openForecasts = await evl(`document.querySelectorAll(".oracle-card").length`);
check("oracle forecasts render", openForecasts === 8, `n=${openForecasts}`);
await shot("v7-oracle");

// Notifications v2
await nav("/notifications");
const notifRows = await evl(`document.querySelectorAll(".dds-notif-row").length`);
check("notifications = 60", notifRows === 60, `rows=${notifRows}`);
check("kind filter chips", await evl(`document.querySelectorAll(".dds-notif-list .feed-tab").length >= 5`));
await nav("/notifications?kind=POLL");
const pollRows = await evl(`document.querySelectorAll(".dds-notif-row").length`);
check("kind filter POLL = 8", pollRows === 8, `rows=${pollRows}`);
await shot("v7-notifications");

// Mobile smoke
await vp(390, 844, true);
await nav("/pages");
check("M pages grid renders", await evl(`document.querySelectorAll(".page-card").length === 12`));
check("M no h-overflow", await evl(`document.documentElement.scrollWidth <= innerWidth`));

console.log("\nCONSOLE/EXCEPTIONS:", errors.length ? errors.slice(0, 6).join(" | ") : "none");
check("no console errors", errors.length === 0, errors.slice(0, 2).join(" | "));
const pass = R.checks.filter((c) => c.ok).length;
console.log(`PHASE3 RESULT: ${pass}/${R.checks.length} PASS`);
try { await fetch(`${CDP}/json/close/${created.id}`); } catch {}
process.exit(0);
