// Discriminator: after story open/close, does a click EVENT reach the see-more button?
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
  await evl(`document.querySelector(${JSON.stringify(sel)})?.scrollIntoView({block:"center"})`);
  await sleep(450);
  const pt = await evl(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); const r = el.getBoundingClientRect(); return { x: r.left + r.width/2, y: r.top + r.height/2 }; })()`);
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: pt.x, y: pt.y, button: "left", buttons: 1, clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: pt.x, y: pt.y, button: "left", buttons: 0, clickCount: 1 });
  await sleep(650);
}
await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: "http://localhost:3107/" });
await sleep(2800);
await evl(`window.__clicks = []; document.addEventListener("click", (e) => { window.__clicks.push(String(e.target.className || e.target.tagName)); }, true); "armed"`);
await tap(".stories-row .story-card:nth-child(2)");
console.log("viewer:", await evl(`!!document.querySelector(".story-viewer")`), "clicks:", await evl(`JSON.stringify(window.__clicks)`));
await tap(".story-viewer-close");
console.log("viewer after close:", await evl(`!!document.querySelector(".story-viewer")`));
await evl(`window.__clicks = []`);
await tap(".see-more-posts");
console.log("clicks on see-more tap:", await evl(`JSON.stringify(window.__clicks)`));
console.log("posts after tap:", await evl(`document.querySelectorAll("[data-post-card]").length`));
await evl(`document.querySelector(".see-more-posts")?.click()`);
await sleep(600);
console.log("posts after JS click:", await evl(`document.querySelectorAll("[data-post-card]").length`));
ws.close(); process.exit(0);
