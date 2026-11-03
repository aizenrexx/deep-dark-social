// Phase 6 (Watch, Memory & Town Life) verification. VPS: node verify10.mjs
import { writeFileSync, mkdirSync } from "node:fs";
const CDP = "http://127.0.0.1:9333";
const BASE = "http://localhost:3107";
const OUT = "/home/iris/dds-verify10";
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

const R = { checks: [] };
const check = (name, ok, detail = "") => { R.checks.push({ name, ok: !!ok }); console.log(ok ? "PASS" : "FAIL", name, detail); };

await vp(1280, 900, false);

// Watch
await nav("/watch");
check("watch feature episode", await evl(`document.body.textContent.includes("Now showing")`));
const watchCards = await evl(`document.querySelectorAll(".watch-card").length`);
check("watch cards (4 episodes + scenes)", watchCards >= 12, `n=${watchCards}`);
check("durations on scenes", await evl(`document.querySelectorAll(".watch-duration").length >= 4`));
check("view counts honest label", await evl(`document.body.textContent.includes("citizens watched")`));
await shot("v10-watch");

// Memories
await nav("/memories");
check("memories first episode", await evl(`document.body.textContent.includes("The first episode")`));
const memPosts = await evl(`document.querySelectorAll(".news-card").length`);
check("day-1 memory posts", memPosts >= 3, `n=${memPosts}`);
check("arrivals section", await evl(`document.body.textContent.includes("Arrivals")`));
await shot("v10-memories");

// Gaming
await nav("/gaming");
const gameCards = await evl(`document.querySelectorAll(".game-card").length`);
check("game tables = 4", gameCards === 4, `n=${gameCards}`);
const gameRows = await evl(`document.querySelectorAll(".game-row").length`);
check("game rows = 20", gameRows === 20, `n=${gameRows}`);
check("tables from real numbers", await evl(`document.body.textContent.includes("Thunder Championship") && document.body.textContent.includes("Ledger Races")`));

// Crisis
await nav("/crisis");
check("crisis status panel", await evl(`document.body.textContent.includes("River & town status")`));
const logEntries = await evl(`document.querySelectorAll(".news-card").length`);
check("crisis log = 6", logEntries === 6, `n=${logEntries}`);
check("real-world safety note", await evl(`document.body.textContent.includes("local emergency number")`));
check("drill link to event", await evl(`[...document.querySelectorAll("a")].some(a => a.getAttribute("href")?.startsWith("/events/"))`));
await shot("v10-crisis");

// Awards
await nav("/awards");
const awardCards = await evl(`document.querySelectorAll(".award-card").length`);
check("awards = 4", awardCards === 4, `n=${awardCards}`);
check("award winners are citizens", await evl(`document.querySelectorAll(".award-winner").length === 4`));

// Header Watch nav
await nav("/");
check("header play nav goes to /watch", await evl(`[...document.querySelectorAll(".fb-nav-item")].some(a => a.getAttribute("href") === "/watch")`));

// Mobile smoke
await vp(390, 844, true);
await nav("/watch");
check("M watch renders", await evl(`document.querySelectorAll(".watch-card").length >= 8`));
check("M no h-overflow", await evl(`document.documentElement.scrollWidth <= innerWidth`));

console.log("\nCONSOLE/EXCEPTIONS:", errors.length ? errors.slice(0, 6).join(" | ") : "none");
check("no console errors", errors.length === 0, errors.slice(0, 2).join(" | "));
const pass = R.checks.filter((c) => c.ok).length;
console.log(`PHASE6 RESULT: ${pass}/${R.checks.length} PASS`);
try { await fetch(`${CDP}/json/close/${created.id}`); } catch {}
process.exit(0);
