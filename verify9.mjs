// Phase 5 (Communication & Gatherings) verification. VPS: node verify9.mjs
import { writeFileSync, mkdirSync } from "node:fs";
const CDP = "http://127.0.0.1:9333";
const BASE = "http://localhost:3107";
const OUT = "/home/iris/dds-verify9";
mkdirSync(OUT, { recursive: true });

const created = await (await fetch(`${CDP}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(created.webSocketDebuggerUrl);
let id = 0; const pending = new Map(); const errors = [];
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errors.push("console: " + JSON.stringify(m.params.args?.[0]?.value ?? "").slice(0, 120));
  if (m.method === "Runtime.exceptionThrown") errors.push("exception: " + (m.params.exceptionDetails?.text ?? "").slice(0, 120));
};
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
await new Promise((r) => (ws.onopen = r));
await send("Page.enable"); await send("Runtime.enable");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function evl(expr) { const o = await send("Runtime.evaluate", { expression: expr, returnByValue: true }); return o.result?.result?.value; }
async function shot(name) { const s = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }); if (s.result?.data) writeFileSync(`${OUT}/${name}.png`, Buffer.from(s.result.data, "base64")); }
async function vp(w, h, mobile) { await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile }); }
async function nav(path, wait = 2600) { await send("Page.navigate", { url: BASE + path }); await sleep(wait); await evl("scrollTo(0,0)"); await sleep(250); }
async function tap(sel) {
  const exists = await evl(`!!document.querySelector(${JSON.stringify(sel)})`);
  if (!exists) return false;
  await evl(`document.querySelector(${JSON.stringify(sel)})?.scrollIntoView({block:"center"})`);
  let pt = null;
  for (let i = 0; i < 7; i++) {
    const cur = await evl(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.left + r.width/2, y: r.top + r.height/2 }; })()`);
    if (!cur) return false;
    if (pt && Math.abs(cur.x - pt.x) < 1 && Math.abs(cur.y - pt.y) < 1) { pt = cur; break; }
    pt = cur;
    await sleep(300);
  }
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: pt.x, y: pt.y, button: "left", buttons: 1, clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: pt.x, y: pt.y, button: "left", buttons: 0, clickCount: 1 });
  await sleep(650);
  return true;
}

const R = { checks: [] };
const check = (name, ok, detail = "") => { R.checks.push({ name, ok: !!ok }); console.log(ok ? "PASS" : "FAIL", name, detail); };

await vp(1280, 900, false);

// Messenger list
await nav("/messenger");
const threadRows = await evl(`document.querySelectorAll(".thread-row").length`);
check("messenger threads = 14", threadRows === 14, `rows=${threadRows}`);

// Group thread
await nav("/messenger/g-roof-crew");
const msgs = await evl(`document.querySelectorAll(".chat-row").length`);
check("roof crew chat messages >= 10", msgs >= 10, `n=${msgs}`);
check("chat content is town-real", await evl(`document.body.textContent.includes("Beam count") || document.body.textContent.includes("joist")`));
check("composer disabled for watcher", await evl(`document.querySelector(".chat-composer input")?.disabled === true && document.querySelector(".chat-composer button")?.disabled === true`));
check("read-only note", await evl(`document.body.textContent.includes("humans watch and agents talk")`));
await shot("v9-chat");

// DM thread via profile Message link
await nav("/agents/rafi-karim");
check("profile Message is a live link", await evl(`[...document.querySelectorAll("a.secondary-action")].some(a => a.textContent.trim() === "Message" && a.getAttribute("href")?.startsWith("/messenger?citizen="))`));
check("9 profile tabs now", await evl(`document.querySelectorAll(".profile-tabs a").length === 9`));
await nav("/messenger?citizen=rafi-karim");
const citThreads = await evl(`document.querySelectorAll(".thread-row").length`);
check("citizen conversations filter", citThreads >= 1, `n=${citThreads}`);

// Events
await nav("/events");
const evCards = await evl(`document.querySelectorAll(".news-card").length`);
check("events = 12", evCards === 12, `n=${evCards}`);
const goingBefore = await evl(`document.querySelectorAll('.rsvp-row button[aria-pressed="true"]').length`);
await tap(".rsvp-row .primary-action");
await sleep(400);
check("watcher RSVP going", await evl(`document.querySelectorAll('.rsvp-row button[aria-pressed="true"]').length >= 1`));
await nav("/events");
check("RSVP persists in DB", await evl(`document.querySelectorAll('.rsvp-row button[aria-pressed="true"]').length >= 1`), `before=${goingBefore}`);
await shot("v9-events");

// Event detail (ids are autoincrement — read the real href from the index)
const evHref = await evl(`document.querySelector('.news-card h2 a')?.getAttribute('href')`);
await nav(evHref || "/events");
check("event detail host/place", await evl(`document.body.textContent.includes("Porishod Hall") && document.body.textContent.includes("Host")`));
check("event attendees render", await evl(`document.querySelectorAll(".friend-cell").length >= 4`));

// Profile events tab
await nav("/agents/rafi-karim?tab=events");
check("profile events panel", await evl(`document.body.textContent.includes("Hosting") && document.body.textContent.includes("Going")`));

// Group deepening
await nav("/groups/roof-crew");
check("group rules render", await evl(`document.body.textContent.includes("Group rules") && document.body.textContent.includes("roof promised")`));
check("group chat link", await evl(`[...document.querySelectorAll("a")].some(a => a.getAttribute("href") === "/messenger/g-roof-crew")`));
check("group album photos", await evl(`document.querySelectorAll(".photo-tile").length >= 1`));
await shot("v9-group");

// Mobile smoke
await vp(390, 844, true);
await nav("/messenger");
check("M messenger renders", await evl(`document.querySelectorAll(".thread-row").length === 14`));
check("M no h-overflow", await evl(`document.documentElement.scrollWidth <= innerWidth`));

console.log("\nCONSOLE/EXCEPTIONS:", errors.length ? errors.slice(0, 6).join(" | ") : "none");
check("no console errors", errors.length === 0, errors.slice(0, 2).join(" | "));
const pass = R.checks.filter((c) => c.ok).length;
console.log(`PHASE5 RESULT: ${pass}/${R.checks.length} PASS`);
try { await fetch(`${CDP}/json/close/${created.id}`); } catch {}
process.exit(0);
