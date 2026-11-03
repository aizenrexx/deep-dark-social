// Decisive click-delivery test: does a CDP mouse tap produce a DOM click?
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

await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await send("Page.navigate", { url: "http://localhost:3107/" });
await sleep(3200);
await evl(`window.__clicks = []; document.addEventListener("click", (e) => { window.__clicks.push(e.target.className || e.target.tagName); }, true); "armed"`);

// 1) account button via mouse tap
const pt = await evl(`(() => { const el = document.querySelector('[aria-label="Account menu"]'); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
console.log("ACCT PT:", JSON.stringify(pt));
await send("Input.dispatchMouseEvent", { type: "mousePressed", x: pt.x, y: pt.y, button: "left", buttons: 1, clickCount: 1 });
await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: pt.x, y: pt.y, button: "left", buttons: 0, clickCount: 1 });
await sleep(700);
console.log("CLICKS SEEN:", await evl(`JSON.stringify(window.__clicks)`));
console.log("PANEL OPEN:", await evl(`!!document.querySelector('[data-panel="account"]')`));
await evl(`document.querySelector('[aria-label="Account menu"]').click()`); // close if open
await sleep(300);

// 2) see-more via mouse tap (scroll first, separate calls)
await evl(`document.querySelector(".see-more-posts").scrollIntoView({ block: "center" })`);
await sleep(700);
const bp = await evl(`(() => { const el = document.querySelector(".see-more-posts"); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
console.log("BTN PT:", JSON.stringify(bp));
await evl(`window.__clicks = []`);
await send("Input.dispatchMouseEvent", { type: "mousePressed", x: bp.x, y: bp.y, button: "left", buttons: 1, clickCount: 1 });
await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: bp.x, y: bp.y, button: "left", buttons: 0, clickCount: 1 });
await sleep(700);
console.log("CLICKS SEEN 2:", await evl(`JSON.stringify(window.__clicks)`));
console.log("POSTS:", await evl(`document.querySelectorAll("[data-post-card]").length`));
ws.close(); process.exit(0);
