// Round-3 verification per Wonder spec §10 — geometry assertions + screenshots.
// Run on the VPS: node verify3.mjs (Chrome CDP at 127.0.0.1:9333, site at localhost:3107)
import { writeFileSync, mkdirSync } from "node:fs";
const CDP = "http://127.0.0.1:9333";
const BASE = "http://localhost:3107";
const OUT = "/home/iris/dds-verify3";
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
async function typeText(text) { for (const ch of text) await send("Input.insertText", { text: ch }); await sleep(300); }

const R = { checks: [], shots: [] };
const check = (name, ok, detail = "") => { R.checks.push({ name, ok: !!ok, detail }); console.log(ok ? "PASS" : "FAIL", name, detail); };

for (const W of [360, 390, 768, 1280]) {
  const mobile = W <= 700;
  await vp(W, mobile ? 844 : 900, mobile);
  await nav("/");
  const inset = W <= 700 ? 8 : 16;
  const padInset = W <= 820 ? 10 : 16;
  const g = await evl(`JSON.stringify({
    sw: document.documentElement.scrollWidth, iw: innerWidth,
    hr: (() => { const el = document.querySelector('[data-testid="header-right"]'); if (!el) return null; const r = el.getBoundingClientRect(); return { left: r.left, right: r.right }; })(),
    headerH: document.querySelector(".fb-header")?.getBoundingClientRect().height,
    docH: document.documentElement.scrollHeight,
    brokenImgs: [...document.images].filter(i => i.complete && i.naturalWidth === 0).length,
    posts: document.querySelectorAll("[data-post-card]").length
  })`);
  const G = JSON.parse(g);
  check(`W${W} no-h-overflow`, G.sw <= G.iw, `sw=${G.sw} iw=${G.iw}`);
  check(`W${W} header-right flush`, G.hr && Math.abs(G.hr.right - (G.sw - padInset)) <= 2, JSON.stringify(G.hr) + " sw=" + G.sw);
  check(`W${W} header 56px`, G.headerH === 56, `h=${G.headerH}`);
  check(`W${W} initial posts = 6`, G.posts === 6, `posts=${G.posts} docH=${G.docH}`);
  check(`W${W} no broken imgs (top)`, G.brokenImgs === 0, `broken=${G.brokenImgs}`);
  const mediaVis = await evl(`(() => { const img = document.querySelector(".media-frame img"); if (!img) return null; const cs = getComputedStyle(img); return { opacity: cs.opacity, nw: img.naturalWidth }; })()`);
  check(`W${W} post media actually visible`, mediaVis && mediaVis.opacity === "1" && mediaVis.nw > 0, JSON.stringify(mediaVis));

  // panels
  for (const [btn, panel] of [["Account menu", "account"], ["Menu", "menu"], ["Notifications", "notifications"]]) {
    const opened = await tap(`[aria-label="${btn}"]`);
    const pr = await evl(`(() => { const el = document.querySelector('[data-panel="${panel}"]'); if (!el) return null; const r = el.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }; })()`);
    check(`W${W} panel ${panel} on-screen`, opened && pr && pr.left >= inset - 1 && pr.right <= G.iw - inset + 1 && Math.abs(pr.top - 52) <= 2, JSON.stringify(pr));
    if (W === 390 && panel === "account") await shot("v3-m-panel-account");
    if (W === 1280 && panel === "account") await shot("v3-d-panel-account");
    await evl(`document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))`);
    await sleep(250);
    await tap(`[aria-label="${btn}"]`); // toggle closed if Esc didn't
    await sleep(200);
  }

  // search
  if (W <= 1099) {
    await tap(".fb-search");
    await sleep(400);
    const bar = await evl(`(() => { const el = document.querySelector(".mobile-search-bar"); if (!el) return null; const r = el.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top }; })()`);
    check(`W${W} mobile search bar spans top`, bar && bar.left === 0 && bar.right === G.sw && bar.top === 56, JSON.stringify(bar));
    await evl(`document.querySelector(".mobile-input")?.focus()`);
    await typeText("rafi");
    await sleep(500);
    const res = await evl(`(() => { const el = document.querySelector(".mobile-results"); if (!el) return null; const r = el.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, rows: el.querySelectorAll(".search-row").length }; })()`);
    check(`W${W} mobile search results`, res && res.rows >= 1 && res.left >= 8 && res.right <= G.iw - 8 + 1, JSON.stringify(res));
    await tap('[aria-label="Close search"]');
  }

  // story viewer (home only)
  await nav("/");
  const storyOpened = await tap(".stories-row .story-card:nth-child(2)");
  await sleep(700);
  const viewer = await evl(`!!document.querySelector(".story-viewer")`);
  check(`W${W} story viewer opens`, storyOpened && viewer);
  if (W === 390 && viewer) await shot("v3-m-story-viewer");
  if (W === 1280 && viewer) await shot("v3-d-story-viewer");
  await tap(".story-viewer-close");

  // see more posts
  const before = await evl(`document.querySelectorAll("[data-post-card]").length`);
  await tap(".see-more-posts");
  const after = await evl(`document.querySelectorAll("[data-post-card]").length`);
  check(`W${W} see-more reveals +6`, after === before + 6, `${before} -> ${after}`);
  await evl("scrollTo(0,0)"); await sleep(300);
  if (W === 390) await shot("v3-m-home-top");
  if (W === 1280) await shot("v3-d-home-top");
  await evl("scrollTo(0, 1500)"); await sleep(900);
  if (W === 390) await shot("v3-m-home-media");
  if (W === 1280) await shot("v3-d-home-media");
  // scroll to bottom: sections present
  const secs = await evl(`JSON.stringify({ town: !!document.querySelector("#town"), citizens: !!document.querySelector("#citizens"), episodes: !!document.querySelector("#episodes"), docH: document.documentElement.scrollHeight, broken: [...document.images].filter(i => i.complete && i.naturalWidth === 0).length })`);
  const S = JSON.parse(secs);
  check(`W${W} sections present`, S.town && S.citizens && S.episodes, secs.slice(0, 120));

  // profile
  await nav("/agents/rafi-karim");
  const prof = await evl(`(() => {
    const a = document.querySelector('[data-testid="profile-avatar-wrap"]'); const c = document.querySelector('[data-testid="profile-cover"]');
    if (!a || !c) return null;
    const ar = a.getBoundingClientRect(); const cr = c.getBoundingClientRect();
    const el = document.elementFromPoint(ar.left + ar.width/2, ar.top + 8);
    const inAvatar = !!el?.closest?.('[data-testid="profile-avatar-wrap"]') || el?.tagName === 'svg' || !!el?.closest?.('svg');
    return { avatarTop: Math.round(ar.top), coverBottom: Math.round(cr.bottom), inAvatar, sw: document.documentElement.scrollWidth, iw: innerWidth };
  })()`);
  check(`W${W} profile avatar above cover`, prof && prof.avatarTop < prof.coverBottom && prof.inAvatar, JSON.stringify(prof));
  check(`W${W} profile no-h-overflow`, prof && prof.sw <= prof.iw, `sw=${prof?.sw}`);
  if (W === 390) await shot("v3-m-profile");
  if (W === 1280) await shot("v3-d-profile");

  // groups
  await nav("/groups");
  const gi = await evl(`JSON.stringify({ sw: document.documentElement.scrollWidth, iw: innerWidth, cards: document.querySelectorAll(".group-card").length, broken: [...document.images].filter(i => i.complete && i.naturalWidth === 0).length })`);
  const GI = JSON.parse(gi);
  check(`W${W} groups index ok`, GI.sw <= GI.iw && GI.cards === 6 && GI.broken === 0, gi.slice(0, 120));
  if (W === 1280) await shot("v3-d-groups");
  await nav("/groups/roof-crew");
  const gp = await evl(`JSON.stringify({ sw: document.documentElement.scrollWidth, iw: innerWidth, badge: !!document.querySelector(".group-badge"), broken: [...document.images].filter(i => i.complete && i.naturalWidth === 0).length })`);
  const GP = JSON.parse(gp);
  check(`W${W} group page ok`, GP.sw <= GP.iw && GP.badge && GP.broken === 0, gp.slice(0, 120));
  if (W === 390) await shot("v3-m-group");
  if (W === 1280) await shot("v3-d-group");

  // welcome
  await nav("/welcome");
  const wel = await evl(`JSON.stringify({ sw: document.documentElement.scrollWidth, iw: innerWidth, pw: !!document.querySelector('input[type="password"]') })`);
  const WE = JSON.parse(wel);
  check(`W${W} welcome ok, no password field`, WE.sw <= WE.iw && !WE.pw, wel);
  if (W === 390) await shot("v3-m-welcome");
  if (W === 1280) await shot("v3-d-welcome");
}

check("zero console errors", errors.length === 0, errors.slice(0, 3).join(" | "));
R.consoleErrors = errors;
writeFileSync(`${OUT}/report.json`, JSON.stringify(R, null, 2));
console.log("TOTAL", R.checks.length, "PASS", R.checks.filter(c => c.ok).length, "FAIL", R.checks.filter(c => !c.ok).length);
ws.close(); process.exit(0);
