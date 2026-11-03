// Picker clipping check only. VPS: node verify13-picker.mjs
import { writeFileSync, mkdirSync } from "node:fs";
const CDP = "http://127.0.0.1:9333";
const BASE = "http://localhost:3107";
const OUT = "/home/iris/dds-verify13";
mkdirSync(OUT, { recursive: true });
const created = await (await fetch(`${CDP}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(created.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
await new Promise((r) => (ws.onopen = r));
await send("Page.enable"); await send("Runtime.enable");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function evl(expr) { const o = await send("Runtime.evaluate", { expression: expr, returnByValue: true }); return o.result?.result?.value; }
await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: BASE + "/posts/40" });
await sleep(2600);
const wrap = await evl(`(() => { const el = document.querySelector("[data-post-card] .reaction-wrap"); el.scrollIntoView({ block: "center" }); const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: wrap.x, y: wrap.y });
await sleep(1200);
const info = await evl(`(() => { const p = document.querySelector('[data-testid="reaction-picker"]'); if (!p) return null; const r = p.getBoundingClientRect(); const first = p.querySelector(".reaction-pick small")?.textContent; const last = [...p.querySelectorAll(".reaction-pick small")].pop()?.textContent; return { top: Math.round(r.top), height: Math.round(r.height), first, last, count: p.querySelectorAll(".reaction-pick").length }; })()`);
console.log("picker:", JSON.stringify(info));
const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
if (shot.result?.data) writeFileSync(`${OUT}/v13-picker-full.png`, Buffer.from(shot.result.data, "base64"));
try { await fetch(`${CDP}/json/close/${created.id}`); } catch {}
process.exit(0);
