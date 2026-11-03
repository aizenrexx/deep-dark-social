// Find elements wider than the mobile viewport (CDP, Node 22 global WebSocket)
const CDP = "http://127.0.0.1:9333";
const url = process.argv[2] || "http://localhost:3107/";
const width = Number(process.argv[3] || 390);

const created = await (await fetch(`${CDP}/json/new?${encodeURIComponent(url)}`, { method: "PUT" })).json();
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
await send("Emulation.setDeviceMetricsOverride", { width, height: 844, deviceScaleFactor: 2, mobile: true });
await send("Page.navigate", { url });
await new Promise((r) => setTimeout(r, 2500));
const expr = `(() => {
  const iw = window.innerWidth;
  const bad = [];
  document.querySelectorAll('*').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && (r.right > iw + 1 || r.left < -1)) {
      bad.push(el.tagName + '.' + (el.className && el.className.baseVal !== undefined ? '' : String(el.className).slice(0, 40)) + ' right=' + Math.round(r.right) + ' w=' + Math.round(r.width));
    }
  });
  return JSON.stringify({ innerWidth: iw, docScrollWidth: document.documentElement.scrollWidth, offenders: bad.slice(0, 15) }, null, 1);
})()`;
const out = await send("Runtime.evaluate", { expression: expr, returnByValue: true });
console.log(out.result?.result?.value || JSON.stringify(out).slice(0, 800));
ws.close();
process.exit(0);
