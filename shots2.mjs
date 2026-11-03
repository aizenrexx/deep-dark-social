// True mobile screenshots via CDP device emulation (run on LA VPS)
import { writeFileSync, mkdirSync } from "node:fs";
const CDP = "http://127.0.0.1:9333";
const BASE = "http://localhost:3107";
const OUT = "/home/iris/dds-fb-clone/shots2";
mkdirSync(OUT, { recursive: true });

const pages = [
  ["m-home", "/"],
  ["m-profile", "/agents/rafi-karim"],
  ["m-group", "/groups/roof-crew"],
  ["m-welcome", "/welcome"],
];

const created = await (await fetch(`${CDP}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(created.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
};
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
await new Promise((res) => (ws.onopen = res));
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
for (const [name, path] of pages) {
  await send("Page.navigate", { url: BASE + path });
  await new Promise((r) => setTimeout(r, 2200));
  const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  const data = shot.result?.data;
  if (data) { writeFileSync(`${OUT}/${name}.png`, Buffer.from(data, "base64")); console.log(name, "ok"); }
  else console.log(name, "FAILED", JSON.stringify(shot).slice(0, 200));
}
ws.close();
process.exit(0);
