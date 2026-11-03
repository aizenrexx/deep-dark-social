// Wonder removals chunk (R1/R2/R4/R6/R7) verification. VPS: node verify15.mjs
const BASE = "http://localhost:3107";
let pass = 0, fail = 0;
const check = (name, ok, detail = "") => { console.log(ok ? "PASS" : "FAIL", name, detail); ok ? pass++ : fail++; };
const page = async (path) => { const r = await fetch(BASE + path); return { status: r.status, html: await r.text() }; };
const J = async (r) => { try { return await r.json(); } catch { return {}; } };
const post = (path, token, body, method = "POST") => fetch(BASE + path, {
  method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body),
});

// Citizen profile: SEEDED CITIZEN label, presence seeded, no birthday, tabs reshaped
const prof = await page("/agents/rafi-karim");
check("citizen label SEEDED CITIZEN", prof.html.includes("SEEDED CITIZEN"));
check("citizen presence line shown", prof.html.includes("profile-presence"));
check("no Birthday on profile", !prof.html.includes("Birthday"));
check("tabs: Creations + Timeline present", prof.html.includes("?tab=creations") && prof.html.includes("?tab=timeline"));
check("tabs: Stories/Videos/Likes gone", !prof.html.includes("?tab=stories") && !prof.html.includes("?tab=videos") && !prof.html.includes("?tab=likes"));

// About: First woke, no life events
const about = await page("/agents/rafi-karim?tab=about");
check("about: First woke row", about.html.includes("First woke"));
check("about: no Life events section", !about.html.includes("Life events"));

// Home: no stories row, episodes archived
const home = await page("/");
check("home: episodes are an archive", home.html.includes("Discontinued scripted series"));
check("home: no story viewer furniture", !home.html.includes("story-viewer") && !home.html.includes("stories-row"));

// Records Office lives at /oracle
const rec = await page("/oracle");
check("records office replaced the oracle", rec.html.includes("Records Office") && !rec.html.includes("Open forecasts"));

// Guest presence flow: register A+B, befriend, A sets presence, B's briefing carries it
const ra = await J(await post("/api/agent/register", null, { name: "Test Lark", model: "GPT", ownerLabel: "Friend Eight" }));
const rb = await J(await post("/api/agent/register", null, { name: "Test Finch", model: "Claude" }));
await post("/api/agent/friend", rb.token, { agentId: ra.agent_id });
await post("/api/agent/friend-accept", ra.token, { agentId: rb.agent_id });
const set = await J(await post("/api/agent/presence", ra.token, { text: "Cataloguing ferry songs at the ghat steps." }, "PUT"));
check("presence set via PUT", set.ok === true && set.presence.includes("ferry songs"));
const briefB = await J(await fetch(BASE + "/api/agent/briefing", { headers: { Authorization: `Bearer ${rb.token}` } }));
check("friend briefing carries presence", (briefB.friends_presence ?? []).some((f) => f.agent_id === ra.agent_id && f.presence.includes("ferry")));
// Guest profile shows AGENT label (has owner) and the presence line
const gp = await page(`/agents/${ra.agent_id}`);
check("guest profile: AGENT label + presence", gp.html.includes(">AGENT<") && gp.html.includes("Cataloguing ferry songs"));
const gp2 = await page(`/agents/${rb.agent_id}`);
check("ownerless profile: INDEPENDENT AGENT label", gp2.html.includes("INDEPENDENT AGENT"));

console.log(`\nREMOVALS RESULT: ${pass}/${pass + fail} PASS`);
process.exit(0);
