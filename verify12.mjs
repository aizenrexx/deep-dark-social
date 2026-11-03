// Phase 8 (Agent Connection Layer) web verification. VPS: node verify12.mjs
// Assumes test-agent-api.sh has run (guest-test-parrot/heron exist).
import { writeFileSync, mkdirSync } from "node:fs";
const CDP = "http://127.0.0.1:9333";
const BASE = "http://localhost:3107";
const OUT = "/home/iris/dds-verify12";
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

// Guest agent profile renders fully
await nav("/agents/guest-test-parrot");
check("guest profile renders", await evl(`document.body.textContent.includes("Test Parrot")`));
check("guest is Visiting Agent", await evl(`document.body.textContent.includes("Visiting Agent")`));
check("guest post on profile", await evl(`document.body.textContent.includes("ferry stories")`));
await shot("v12-guest-profile");

// Their post is in the town feed (Most Recent)
await nav("/?tab=recent");
check("guest post appears in feed", await evl(`document.body.textContent.includes("Test Parrot")`));

// The group they created renders
await nav("/groups/ferry-story-collectors");
check("guest-created group renders", await evl(`document.body.textContent.includes("Ferry Story Collectors")`));

// DM privacy on the web: list shows the lock note, thread is sealed
await nav("/messenger");
check("messenger shows private note for guest DM", await evl(`document.body.textContent.includes("Private conversation — only the two agents and their owners can read it.")`));
check("guest DM text NOT leaked in list", await evl(`!document.body.textContent.includes("ferry bell rang twice")`));
await nav("/messenger/dm-guest-test-heron-guest-test-parrot");
check("DM thread sealed page", await evl(`document.body.textContent.includes("stays sealed to everyone else")`));
check("DM text NOT on thread page", await evl(`!document.body.textContent.includes("ferry bell rang twice") && !document.body.textContent.includes("polished it with love")`));
await shot("v12-dm-sealed");

// Town DM still readable (watcher owns the town citizens)
await nav("/messenger");
const townDm = await evl(`[...document.querySelectorAll(".thread-row")].map(a => a.getAttribute("href")).find(h => h && h.startsWith("/messenger/dm-") && !h.includes("guest"))`);
await nav(townDm || "/messenger");
check("town DM still readable", await evl(`document.querySelectorAll(".chat-row").length >= 3`));

// Developers page
await nav("/developers");
check("developers page renders steps", await evl(`document.body.textContent.includes("Register (once)") && document.body.textContent.includes("Private means private")`));
await shot("v12-developers");

console.log("\nCONSOLE/EXCEPTIONS:", errors.length ? errors.slice(0, 6).join(" | ") : "none");
check("no console errors", errors.length === 0, errors.slice(0, 2).join(" | "));
const pass = R.checks.filter((c) => c.ok).length;
console.log(`PHASE8 RESULT: ${pass}/${R.checks.length} PASS`);
try { await fetch(`${CDP}/json/close/${created.id}`); } catch {}
process.exit(0);
