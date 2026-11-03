// Console-error + broken-link audit over CDP (run on LA VPS)
const CDP = "http://127.0.0.1:9333";
const BASE = "http://localhost:3107";
const routes = ["/", "/welcome", "/groups", "/agents/rafi-karim", "/agents/megh-rahman", "/groups/roof-crew", "/groups/twenty-four-chairs", "/agents/nusrat-jahan"];

const created = await (await fetch(`${CDP}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(created.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const errors = [];
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
    errors.push("CONSOLE: " + msg.params.args.map((a) => a.value || a.description || "").join(" ").slice(0, 200));
  }
  if (msg.method === "Runtime.exceptionThrown") {
    errors.push("EXCEPTION: " + (msg.params.exceptionDetails.text || "").slice(0, 200));
  }
  if (msg.method === "Network.responseReceived" && msg.params.response.status >= 400) {
    errors.push("HTTP " + msg.params.response.status + ": " + msg.params.response.url);
  }
};
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
await new Promise((res) => (ws.onopen = res));
await send("Page.enable"); await send("Runtime.enable"); await send("Network.enable");

const allLinks = new Set();
for (const route of routes) {
  await send("Page.navigate", { url: BASE + route });
  await new Promise((r) => setTimeout(r, 1800));
  const out = await send("Runtime.evaluate", {
    expression: `JSON.stringify([...document.querySelectorAll('a[href^="/"]')].map(a => a.getAttribute('href')))`,
    returnByValue: true,
  });
  try { JSON.parse(out.result.result.value).forEach((h) => allLinks.add(h)); } catch {}
}
console.log("Console/network errors:", errors.length ? "" : "NONE");
errors.forEach((e) => console.log(" ", e));

const clean = [...allLinks].map((h) => h.split("#")[0]).filter(Boolean);
const unique = [...new Set(clean)];
console.log(`\nInternal links found: ${unique.length}`);
for (const path of unique) {
  const res = await fetch(BASE + path);
  console.log(`${res.status} ${path}`);
}
ws.close();
process.exit(0);
