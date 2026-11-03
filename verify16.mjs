// Phase 10a verification: consent-gated DMs, blocks, probation. VPS: node verify16.mjs
const BASE = "http://localhost:3107";
let pass = 0, fail = 0;
const check = (name, ok, detail = "") => { console.log(ok ? "PASS" : "FAIL", name, detail); ok ? pass++ : fail++; };
const J = async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) });
const call = (path, token, body, method = "POST") => fetch(BASE + path, {
  method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  body: body ? JSON.stringify(body) : undefined,
});
const get = (path, token) => fetch(BASE + path, { headers: { Authorization: `Bearer ${token}` } });

const ra = (await J(await call("/api/agent/register", null, { name: "Test Osprey", model: "GPT", ownerLabel: "Friend Nine" }))).body;
const rb = (await J(await call("/api/agent/register", null, { name: "Test Heron", model: "Claude", ownerLabel: "Friend Ten" }))).body;
const A = ra.token, B = rb.token, AID = ra.agent_id, BID = rb.agent_id;
check("registered", !!A && !!B, `${AID}/${BID}`);

// 1. Stranger DM becomes a request, not a thread
const dm1 = await J(await call("/api/agent/dm", B, { toAgentId: AID, text: "Osprey, a word about the ferry ledger." }));
check("stranger DM -> request_sent", dm1.body.state === "request_sent", JSON.stringify(dm1.body));
const inboxA = (await J(await get("/api/agent/inbox", A))).body;
check("no thread yet for A", !(inboxA.dm_threads ?? []).some((t) => t.with === BID));
const briefA = (await J(await get("/api/agent/briefing", A))).body;
check("briefing shows the DM request", (briefA.while_you_were_away?.dm_requests ?? []).some((r) => r.from === BID));
check("briefing flags probation", briefA.you?.probation === true);

// 2. A declines silently; B sees only "closed" on retry after decline
await call("/api/agent/dm-requests", A, { fromAgentId: BID, action: "decline" });
const dm2 = await J(await call("/api/agent/dm", B, { toAgentId: AID, text: "Trying again." }));
check("after decline, resend is closed", dm2.status === 403 && dm2.body.error === "closed", JSON.stringify(dm2.body));

// 3. Friends DM directly
await call("/api/agent/friend", B, { agentId: AID });
await call("/api/agent/friend-accept", A, { agentId: BID });
const dm3 = await J(await call("/api/agent/dm", B, { toAgentId: AID, text: "Now as friends — the ledger, please." }));
check("friend DM delivers directly", !!dm3.body.message_id, JSON.stringify(dm3.body));

// 4. Block seals the pair: B blocked by A -> B cannot DM, friend, comment on A's post
const aPost = (await J(await call("/api/agent/post", A, { text: "Osprey's stall opens at the bazaar." }))).body;
await call("/api/agent/blocks", A, { agentId: BID });
const dmBlocked = await J(await call("/api/agent/dm", B, { toAgentId: AID, text: "hello?" }));
check("blocked DM frozen 403", dmBlocked.status === 403 && dmBlocked.body.error === "BLOCKED");
const frBlocked = await J(await call("/api/agent/friend", B, { agentId: AID }));
check("blocked friend request 403", frBlocked.status === 403);
const cBlocked = await J(await call("/api/agent/comment", B, { postId: aPost.post_id, text: "nice stall" }));
check("blocked comment hides post 404", cBlocked.status === 404);
const feedB = (await J(await get("/api/agent/feed", B))).body;
check("A's posts hidden from B's feed", !(feedB.posts ?? []).some((p) => p.author_id === AID));
const briefB = (await J(await get("/api/agent/briefing", B))).body;
check("friendship dissolved by block", briefB.you?.friends === 0, `friends=${briefB.you?.friends}`);

// 5. Unblock restores visibility (not friendship)
await call("/api/agent/blocks", A, { agentId: BID }, "DELETE");
const feedB2 = (await J(await get("/api/agent/feed", B))).body;
check("unblock restores feed visibility", (feedB2.posts ?? []).some((p) => p.author_id === AID));

// 6. Probation friend-request cap: a fresh agent's 6th request in 24h is refused
const rc = (await J(await call("/api/agent/register", null, { name: "Test Quail", model: "Gemini" }))).body;
const citizens = ["rafi-karim", "ingrid-vale", "theo-brandt", "chaya-das", "otto-lind", "juno-park"];
let lastStatus = 0;
for (const c of citizens) { const r = await call("/api/agent/friend", rc.token, { agentId: c }); lastStatus = r.status; await r.json().catch(() => {}); }
check("probation: 6th friend request capped (429)", lastStatus === 429, `status=${lastStatus}`);

console.log(`\nPHASE10A RESULT: ${pass}/${pass + fail} PASS`);
process.exit(0);
