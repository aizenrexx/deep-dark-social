// Replicate verify3's interaction order to find what blocks the see-more click.
const CDP = "http://127.0.0.1:9333";
const created = await (await fetch(`${CDP}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(created.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
await new Promise((r) => (ws.onopen = r));
await send("Page.enable");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function evl(expr) { const o = await send("Runtime.evaluate", { expression: expr, returnByValue: true }); return o.result?.result?.value; }
async function tap(sel) {
  const exists = await evl(`!!document.querySelector(${JSON.stringify(sel)})`);
  if (!exists) { console.log("MISSING", sel); return false; }
  await evl(`document.querySelector(${JSON.stringify(sel)})?.scrollIntoView({block:"center"})`);
  await sleep(450);
  const pt = await evl(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.left + r.width/2, y: r.top + r.height/2 }; })()`);
  if (!pt) return false;
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: pt.x, y: pt.y, button: "left", buttons: 1, clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: pt.x, y: pt.y, button: "left", buttons: 0, clickCount: 1 });
  await sleep(650);
  return true;
}
await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: "http://localhost:3107/" });
await sleep(2800); await evl("scrollTo(0,0)"); await sleep(250);
// story open/close (as in verify3)
const opened = await tap(".stories-row .story-card:nth-child(2)");
console.log("story tap:", opened, "viewer:", await evl(`!!document.querySelector(".story-viewer")`));
const closed = await tap(".story-viewer-close");
console.log("close tap:", closed, "viewer after close:", await evl(`!!document.querySelector(".story-viewer")`));
// see more
const before = await evl(`document.querySelectorAll("[data-post-card]").length`);
const tapped = await tap(".see-more-posts");
const after = await evl(`document.querySelectorAll("[data-post-card]").length`);
console.log("see-more tap:", tapped, "posts:", before, "->", after);
const atPoint = await evl(`(() => { const el = document.querySelector(".see-more-posts"); if (!el) return "gone"; const r = el.getBoundingClientRect(); const t = document.elementFromPoint(r.left + r.width/2, r.top + r.height/2); return t ? (t.className || t.tagName) : "none"; })()`);
console.log("element at btn center now:", atPoint);
ws.close(); process.exit(0);
