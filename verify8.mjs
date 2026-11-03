// Phase 4 (Economy) verification. VPS: node verify8.mjs
import { writeFileSync, mkdirSync } from "node:fs";
const CDP = "http://127.0.0.1:9333";
const BASE = "http://localhost:3107";
const OUT = "/home/iris/dds-verify8";
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

// Marketplace
await nav("/marketplace");
const cards = await evl(`document.querySelectorAll(".listing-card").length`);
check("marketplace grid = 48", cards === 48, `cards=${cards}`);
await evl(`[...document.querySelectorAll(".feed-tab")].find(e => e.textContent === "Food")?.click()`);
await sleep(500);
const foodCards = await evl(`document.querySelectorAll(".listing-card").length`);
check("category filter narrows", foodCards > 0 && foodCards < 48, `food=${foodCards}`);
await evl(`[...document.querySelectorAll(".feed-tab")].find(e => e.textContent === "All")?.click()`);
await sleep(400);
await evl(`{ const i = document.querySelector(".market-search"); i.focus(); document.execCommand("insertText", false, "ferry"); }`);
await sleep(500);
const searchCards = await evl(`document.querySelectorAll(".listing-card").length`);
check("listing search works", searchCards >= 1 && searchCards < 10, `n=${searchCards}`);
await shot("v8-marketplace");

// Listing detail
const firstHref = await evl(`document.querySelector(".listing-card")?.getAttribute("href")`);
await nav(firstHref);
check("buy button disabled with reason", await evl(`(() => { const b = [...document.querySelectorAll("button")].find(x => x.textContent.trim() === "Buy"); return b && b.disabled && document.body.textContent.includes("kori belongs to the town"); })()`));
check("fair line from citizens", await evl(`document.body.textContent.includes("Citizens on the price")`));
await tap('.fair-vote button[aria-pressed]');
await sleep(300);
// tap the FAIR chip specifically (first chip)
const fairState = await evl(`document.querySelectorAll('.fair-vote button')[0].getAttribute("aria-pressed")`);
if (fairState !== "true") { await tap(".fair-vote button"); await sleep(300); }
check("watcher fair vote cast", await evl(`document.querySelectorAll('.fair-vote button')[0].getAttribute("aria-pressed") === "true"`));
await tap(".listing-actions .secondary-action");
check("watch price toggles", await evl(`document.querySelector(".listing-actions .secondary-action").textContent.includes("Watching")`));
await shot("v8-listing");

// Persist across reload
await nav(firstHref);
check("vote persists in DB", await evl(`document.querySelectorAll('.fair-vote button')[0].getAttribute("aria-pressed") === "true"`));

// Offers / fundraisers / jobs
await nav("/offers");
check("offers = 12", await evl(`document.querySelectorAll(".news-card").length === 12`));
await nav("/fundraisers");
const fundCards = await evl(`document.querySelectorAll(".news-card").length`);
check("fundraisers = 6", fundCards === 6, `n=${fundCards}`);
check("fund progress bars", await evl(`document.querySelectorAll(".fund-bar").length === 6`));
check("fund raised lines", await evl(`document.body.textContent.includes("raised") && document.body.textContent.includes("kori")`));
await shot("v8-fundraisers");
await nav("/jobs");
check("jobs = 16", await evl(`document.querySelectorAll(".job-card").length === 16`));
check("job pay shown", await evl(`document.querySelectorAll(".job-pay").length === 16`));

// Kori & ledger
await nav("/kori");
check("treasury total line", await evl(`document.body.textContent.includes("Total in town")`));
check("week shape canon (43)", await evl(`document.body.textContent.includes("43 out")`));
check("debt floor holds line", await evl(`document.body.textContent.includes("the floor holds")`));
const balances = await evl(`document.querySelectorAll(".balance-row").length`);
check("balances = 24 citizens", balances === 24, `n=${balances}`);
const ledgerRows = await evl(`document.querySelectorAll(".ledger-row").length`);
check("ledger rows render", ledgerRows >= 40, `n=${ledgerRows}`);
await shot("v8-kori");

// Mobile smoke
await vp(390, 844, true);
await nav("/marketplace");
check("M marketplace renders", await evl(`document.querySelectorAll(".listing-card").length === 48`));
check("M no h-overflow", await evl(`document.documentElement.scrollWidth <= innerWidth`));

console.log("\nCONSOLE/EXCEPTIONS:", errors.length ? errors.slice(0, 6).join(" | ") : "none");
check("no console errors", errors.length === 0, errors.slice(0, 2).join(" | "));
const pass = R.checks.filter((c) => c.ok).length;
console.log(`PHASE4 RESULT: ${pass}/${R.checks.length} PASS`);
try { await fetch(`${CDP}/json/close/${created.id}`); } catch {}
process.exit(0);
