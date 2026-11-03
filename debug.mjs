// Deep self-audit: open the live site like the boss would, scroll everything,
// tap every control, on BOTH mobile and desktop. Save every screenshot + a defect report.
import { writeFileSync, mkdirSync } from "node:fs";
const CDP = "http://127.0.0.1:9333";
const BASE = "http://localhost:3107";
const OUT = "/home/iris/dds-debug";
mkdirSync(OUT, { recursive: true });

const created = await (await fetch(`${CDP}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(created.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const consoleErrors = [];
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") {
    consoleErrors.push(m.params.args?.map((a) => a.value || a.description || "").join(" ").slice(0, 200));
  }
  if (m.method === "Runtime.exceptionThrown") {
    consoleErrors.push("EXC: " + (m.params.exceptionDetails?.exception?.description || "").slice(0, 200));
  }
};
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
await new Promise((r) => (ws.onopen = r));
await send("Page.enable");
await send("Runtime.enable");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function evl(expr) {
  const out = await send("Runtime.evaluate", { expression: expr, returnByValue: true });
  return out.result?.result?.value;
}
async function shot(name) {
  const s = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  if (s.result?.data) writeFileSync(`${OUT}/${name}.png`, Buffer.from(s.result.data, "base64"));
  console.log("shot", name);
}
async function viewport(w, h, mobile) {
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile });
  if (mobile) await send("Emulation.setTouchEmulationEnabled", { enabled: true });
}
async function nav(path) { await send("Page.navigate", { url: BASE + path }); await sleep(1800); }
async function tap(selector) {
  const pt = await evl(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  if (!pt) { console.log("tap MISS", selector); return; }
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: pt.x, y: pt.y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: pt.x, y: pt.y, button: "left", clickCount: 1 });
  await sleep(700);
}

const report = { consoleErrors, pages: {} };

async function auditPage(key, path, mobile) {
  await nav(path);
  const info = await evl(`JSON.stringify({
    iw: innerWidth, sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight,
    stray: [...document.querySelectorAll("*")].filter(e => { const s = getComputedStyle(e); const r = e.getBoundingClientRect(); return (s.position === "fixed" || s.position === "absolute") && r.width > 0 && r.height > 0 && r.bottom > 56 && e.closest("header") && !e.closest(".fb-header") === false; }).slice(0,5).map(e => e.className),
    wide: [...document.querySelectorAll("body *")].filter(e => { const r = e.getBoundingClientRect(); return r.width > innerWidth + 1 && getComputedStyle(e).position !== "fixed"; }).slice(0, 8).map(e => e.className + ":" + Math.round(e.getBoundingClientRect().width))
  })`);
  report.pages[key] = JSON.parse(info || "{}");
  // scroll segments
  const total = await evl("document.documentElement.scrollHeight");
  const step = mobile ? 700 : 800;
  let n = 0;
  for (let y = 0; y < total && n < 7; y += step, n++) {
    await evl(`scrollTo(0, ${y})`); await sleep(450);
    await shot(`${key}-s${n}`);
  }
  await evl("scrollTo(0,0)"); await sleep(400);
}

// ---------- MOBILE ----------
await viewport(390, 844, true);
await auditPage("m-home", "/", true);
// header interactions on mobile
await tap(".fb-account-button"); await shot("m-panel-account"); await tap(".fb-account-button");
await tap(".fb-round-button.notification"); await shot("m-panel-bell");
await evl(`document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))`); await sleep(400);
await tap(".composer-pill"); await shot("m-composer-dialog");
await evl(`document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))`); await sleep(300);
await tap(".post-actions button"); await shot("m-after-like");
await auditPage("m-profile", "/agents/rafi-karim", true);
await auditPage("m-group", "/groups/roof-crew", true);
await auditPage("m-welcome", "/welcome", true);

// ---------- DESKTOP ----------
await viewport(1280, 900, false);
await auditPage("d-home", "/", false);
await tap(".fb-account-button"); await shot("d-panel-account"); await tap(".fb-account-button");
// search typing
await evl(`(() => { const i = document.querySelector(".fb-search-input"); i.focus(); })()`);
await send("Input.insertText", { text: "rafi" });
await sleep(700); await shot("d-search-results");
await evl(`document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))`); await sleep(300);
await tap(".fb-round-button.notification"); await shot("d-panel-bell");
await evl(`document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))`); await sleep(300);
await tap(".composer-pill"); await shot("d-composer-dialog");
await evl(`document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))`); await sleep(300);
await auditPage("d-profile", "/agents/rafi-karim", false);
await auditPage("d-groups", "/groups", false);
await auditPage("d-group", "/groups/roof-crew", false);
await auditPage("d-welcome", "/welcome", false);

writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
console.log("REPORT", JSON.stringify(report).slice(0, 1500));
ws.close();
process.exit(0);
