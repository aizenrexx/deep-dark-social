// Phase 7 (Settings, dark mode, parity) verification. VPS: node verify11.mjs
import { writeFileSync, mkdirSync } from "node:fs";
const CDP = "http://127.0.0.1:9333";
const BASE = "http://localhost:3107";
const OUT = "/home/iris/dds-verify11";
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
async function tapText(rowLabel, optionLabel) {
  return evl(`(() => {
    const rows = [...document.querySelectorAll(".setting-row")];
    const row = rows.find(r => r.querySelector(".setting-label")?.textContent === ${JSON.stringify(rowLabel)});
    const btn = row && [...row.querySelectorAll("button")].find(b => b.textContent.trim() === ${JSON.stringify(optionLabel)});
    if (btn) { btn.click(); return true; }
    return false;
  })()`);
}

const R = { checks: [] };
const check = (name, ok, detail = "") => { R.checks.push({ name, ok: !!ok }); console.log(ok ? "PASS" : "FAIL", name, detail); };

await vp(1280, 900, false);

// Parity audit
await nav("/settings/parity");
const parityRows = await evl(`document.querySelectorAll(".parity-row").length`);
check("parity rows >= 30", parityRows >= 30, `rows=${parityRows}`);
check("parity live counts from DB", await evl(`document.body.textContent.includes("96 posts")`));
check("honest Not yet row (tick engine)", await evl(`document.body.textContent.includes("Live tick engine") && document.body.textContent.includes("Not yet")`));
check("By design rows present", await evl(`document.querySelectorAll(".parity-state.design").length >= 3`));
await shot("v11-parity");

// Settings: dark mode
await nav("/settings");
check("settings groups render", await evl(`document.querySelectorAll(".setting-row").length === 3`));
await tapText("Appearance", "Dark");
await sleep(700);
check("dark theme applied", await evl(`document.documentElement.dataset.theme === "dark"`));
const darkBg = await evl(`getComputedStyle(document.body).backgroundColor`);
check("dark background computed", darkBg === "rgb(24, 25, 26)", darkBg);
await shot("v11-dark-settings");
await nav("/");
await sleep(600);
check("dark persists across pages", await evl(`document.documentElement.dataset.theme === "dark"`));
await shot("v11-dark-home");

// Feed default: set to Most Recent, home should open on recent tab
await nav("/settings");
await tapText("Feed opens on", "Most Recent");
await sleep(500);
await nav("/");
check("feed default = recent active", await evl(`document.querySelector('.feed-tab.active')?.textContent.includes("Most Recent")`));

// Restore light + home for the town's next visitor checks
await nav("/settings");
await tapText("Appearance", "Light");
await tapText("Feed opens on", "Home");
await sleep(500);
check("restored to light", await evl(`document.documentElement.dataset.theme === "light"`));

// Reduce motion toggle saves
await tapText("Reduce motion", "On");
await sleep(400);
check("motion attribute set", await evl(`document.documentElement.dataset.motion === "reduced"`));
await tapText("Reduce motion", "Off");
await sleep(300);

// Mobile smoke in restored state
await vp(390, 844, true);
await nav("/settings");
check("M settings render", await evl(`document.querySelectorAll(".setting-row").length === 3`));
check("M no h-overflow", await evl(`document.documentElement.scrollWidth <= innerWidth`));

console.log("\nCONSOLE/EXCEPTIONS:", errors.length ? errors.slice(0, 6).join(" | ") : "none");
check("no console errors", errors.length === 0, errors.slice(0, 2).join(" | "));
const pass = R.checks.filter((c) => c.ok).length;
console.log(`PHASE7 RESULT: ${pass}/${R.checks.length} PASS`);
try { await fetch(`${CDP}/json/close/${created.id}`); } catch {}
process.exit(0);
