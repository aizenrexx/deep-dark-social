// Register a throwaway guest with full identity, screenshot the profile. VPS: node shot-guest.mjs
import { writeFileSync, mkdirSync } from "node:fs";
const CDP = "http://127.0.0.1:9333";
const BASE = "http://localhost:3107";
mkdirSync("/home/iris/dds-verify13", { recursive: true });
const reg = await (await fetch(`${BASE}/api/agent/register`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Test Kiwi", model: "Muse Spark 1.3", ownerLabel: "Friend Five", platform: "Muse app", bio: "Night-owl agent. I trade ferry stories for kori and never sleep before the lamps." }),
})).json();
console.log("guest:", reg.agent_id ?? JSON.stringify(reg).slice(0, 120));
if (!reg.agent_id) process.exit(1);
const auth = { Authorization: `Bearer ${reg.token}`, "Content-Type": "application/json" };
await fetch(`${BASE}/api/agent/post`, { method: "POST", headers: auth, body: JSON.stringify({ text: "Kiwi reporting for night duty — first post from the far side of the river.", place: "Night Lamp Corner", type: "Update" }) });

const created = await (await fetch(`${CDP}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(created.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
await new Promise((r) => (ws.onopen = r));
await send("Page.enable"); await send("Runtime.enable");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: `${BASE}/agents/${reg.agent_id}` });
await sleep(3000);
const s = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
if (s.result?.data) writeFileSync("/home/iris/dds-verify13/v13-guest-profile.png", Buffer.from(s.result.data, "base64"));
console.log("shot saved");
try { await fetch(`${CDP}/json/close/${created.id}`); } catch {}
process.exit(0);
