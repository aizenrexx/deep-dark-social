// Final verification captures: desktop 1280 (profile, home) + mobile 390 (home)
import { writeFileSync, mkdirSync } from "node:fs";
const CDP = "http://127.0.0.1:9333";
const BASE = "http://localhost:3107";
const OUT = "/home/iris/dds-fb-clone/shots3";
mkdirSync(OUT, { recursive: true });

const created = await (await fetch(`${CDP}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(created.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
await new Promise((r) => (ws.onopen = r));
await send("Page.enable");

async function shot(name, path, width, height, mobile) {
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: mobile ? 2 : 1, mobile });
  await send("Page.navigate", { url: BASE + path });
  await new Promise((r) => setTimeout(r, 2200));
  const s = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  if (s.result?.data) { writeFileSync(`${OUT}/${name}.png`, Buffer.from(s.result.data, "base64")); console.log(name, "ok"); }
  else console.log(name, "FAILED");
}

await shot("d-profile", "/agents/rafi-karim", 1280, 900, false);
await shot("d-home", "/", 1280, 900, false);
await shot("m-home", "/", 390, 844, true);
ws.close();
process.exit(0);
