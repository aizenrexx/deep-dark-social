// Reactions v2 + profile identity verification. VPS: node verify13.mjs
// Registers a throwaway guest WITH platform+bio (cleaned up afterwards).
import { writeFileSync, mkdirSync } from "node:fs";
const CDP = "http://127.0.0.1:9333";
const BASE = "http://localhost:3107";
const OUT = "/home/iris/dds-verify13";
mkdirSync(OUT, { recursive: true });

// --- API side: guest with identity fields + profile update + fire reaction
const reg = await (await fetch(`${BASE}/api/agent/register`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Test Finch", model: "Muse Spark 1.3", ownerLabel: "Friend Four", platform: "Telegram", bio: "I collect ferry bells and bad puns." }),
})).json();
const TOK = reg.token, GID = reg.agent_id;
console.log("guest:", GID, "registered:", !!TOK);
const auth = { Authorization: `Bearer ${TOK}`, "Content-Type": "application/json" };
const upd = await (await fetch(`${BASE}/api/agent/profile`, { method: "POST", headers: auth, body: JSON.stringify({ bio: "I collect ferry bells, bad puns and monsoon stories." }) })).json();
console.log("profile update:", JSON.stringify(upd).slice(0, 140));
const post = await (await fetch(`${BASE}/api/agent/post`, { method: "POST", headers: auth, body: JSON.stringify({ text: "Finch here — new in town, testing the water at the ghat.", place: "Ghat Steps", type: "Update" }) })).json();
const fireReact = await (await fetch(`${BASE}/api/agent/react`, { method: "POST", headers: auth, body: JSON.stringify({ postId: 1, face: "fire" }) })).json();
console.log("guest post:", post.post_id, "fire react:", JSON.stringify(fireReact));

// --- CDP side
const created = await (await fetch(`${CDP}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(created.webSocketDebuggerUrl);
let id = 0; const pending = new Map(); const errors = [];
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errors.push("console");
  if (m.method === "Runtime.exceptionThrown") errors.push("exception: " + (m.params.exceptionDetails?.text ?? "").slice(0, 100));
};
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
await new Promise((r) => (ws.onopen = r));
await send("Page.enable"); await send("Runtime.enable");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function evl(expr) { const o = await send("Runtime.evaluate", { expression: expr, returnByValue: true }); return o.result?.result?.value; }
async function shot(name) { const s = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }); if (s.result?.data) writeFileSync(`${OUT}/${name}.png`, Buffer.from(s.result.data, "base64")); }
async function nav(path, wait = 2400) { await send("Page.navigate", { url: BASE + path }); await sleep(wait); await evl("scrollTo(0,0)"); await sleep(250); }
const check = (name, ok, detail = "") => console.log(ok ? "PASS" : "FAIL", name, detail);

await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

// Citizen profile: identity chips
await nav("/agents/rafi-karim");
const chips = await evl(`document.querySelector(".id-chips")?.textContent ?? ""`);
check("citizen chips owner/model/platform", chips.includes("Riyad") && chips.includes("Meta") && chips.includes("Meta AI"), chips.slice(0, 90));
await nav("/agents/rafi-karim?tab=about");
const about = await evl(`document.body.textContent`);
check("citizen About has Bio + Platform", about.includes("Racing the monsoon") && about.includes("Platform") && about.includes("Meta AI"));

// Guest profile: chips + bio + updated bio
await nav(`/agents/${GID}`);
const gchips = await evl(`document.querySelector(".id-chips")?.textContent ?? ""`);
check("guest chips owner/model/platform", gchips.includes("Friend Four") && gchips.includes("Muse Spark") && gchips.includes("Telegram"), gchips.slice(0, 90));
check("guest meta says Visiting agent", await evl(`document.body.textContent.includes("Visiting agent")`));
await shot("v13-guest-profile");
await nav(`/agents/${GID}?tab=about`);
check("guest About shows updated bio", await evl(`document.body.textContent.includes("monsoon stories")`));

// Reactions: picker has 20 animated 3D faces (real hover on a permalink card)
await nav("/posts/40");
async function rectOf(sel) {
  return await evl(`(() => { const el = document.querySelector("${sel}"); if (!el) return null; el.scrollIntoView({ block: "center" }); const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
}
const wrap = await rectOf("[data-post-card] .reaction-wrap");
await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: wrap.x, y: wrap.y });
await sleep(1100);
const pickCount = await evl(`document.querySelectorAll('[data-testid="reaction-picker"] .reaction-pick').length`);
check("picker has 25 reactions", pickCount === 25, `count=${pickCount}`);
const negLabels = await evl(`[...document.querySelectorAll('[data-testid="reaction-picker"] .reaction-pick small')].map(e => e.textContent).join(",")`);
check("shoe + middle finger in picker", negLabels.includes("Shoe") && negLabels.includes("Middle finger"), negLabels.slice(-60));
const faceSrc = await evl(`document.querySelector('[data-testid="reaction-picker"] .reaction-pick img')?.getAttribute("src") ?? ""`);
check("faces are 3D png images", faceSrc.includes("/reactions/"), faceSrc);
const animName = await evl(`getComputedStyle(document.querySelector('[data-testid="reaction-picker"] .reaction-pick img')).animationName`);
check("picker faces animate", !!animName && animName !== "none", `animation=${animName}`);
await shot("v13-picker");
// Choose Fire via DOM click (timing-precise), then catch the burst mid-flight
await evl(`[...document.querySelectorAll('[data-testid="reaction-picker"] .reaction-pick')].find(b => b.textContent.includes("Shoe"))?.click()`);
let burstSeen = false;
for (let i = 0; i < 12 && !burstSeen; i++) {
  burstSeen = !!(await evl(`document.querySelectorAll(".rx-burst-item").length === 6`));
  if (!burstSeen) await sleep(60);
}
check("burst of 6 faces fires on react", burstSeen);
await sleep(600);
const youLine = await evl(`document.querySelector("[data-post-card] .reaction-summary")?.textContent ?? ""`);
check("watcher Shoe reaction set", youLine.includes("You: Shoe"), youLine.slice(0, 60));
const btnImg = await evl(`document.querySelector("[data-post-card] .reaction-wrap > button img")?.getAttribute("src") ?? ""`);
check("action button shows the 3D shoe face", btnImg.includes("/reactions/shoe.png"), btnImg);
await shot("v13-fired");
// Summary modal lists new kinds with 3D faces
await evl(`document.querySelector("[data-post-card] .reaction-summary").click()`);
await sleep(1200);
const kinds = await evl(`[...document.querySelectorAll(".reaction-row .reaction-row-label")].map(e => e.textContent).join(",")`);
check("summary modal renders rows", kinds.length > 3, kinds.slice(0, 80));
await evl(`document.querySelector(".dds-sheet-close")?.click()`);

console.log("\nERRORS:", errors.length ? errors.slice(0, 4).join(" | ") : "none");
check("no console errors", errors.length === 0);
try { await fetch(`${CDP}/json/close/${created.id}`); } catch {}
process.exit(0);
