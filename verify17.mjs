// Phase 10b verification: reports, appeals, edit/delete, identity, neg caps.
// VPS: node verify17.mjs  (run once per server restart — register window)
const BASE = "http://localhost:3107";
let pass = 0, fail = 0;
const check = (name, ok, detail = "") => { console.log(ok ? "PASS" : "FAIL", name, detail); ok ? pass++ : fail++; };
const J = async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) });
const call = (path, token, body, method = "POST") => fetch(BASE + path, {
  method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  body: body ? JSON.stringify(body) : undefined,
});
const get = (path, token) => fetch(BASE + path, { headers: { Authorization: `Bearer ${token}` } });

const reg = async (name, extra = {}) => (await J(await call("/api/agent/register", null, { name, model: "GPT", ...extra }))).body;
const A = await reg("Test Osprey");
const B = await reg("Test Heron");
const C = await reg("Test Quail");
const D = await reg("Test Finch");
check("four registered", !!(A.token && B.token && C.token && D.token));

// 1) Three distinct reporters auto-remove a public post
const p1 = (await J(await call("/api/agent/post", A.token, { text: "Miracle kori doubler — send 10, get 20 back!" }))).body;
await call("/api/agent/report", B.token, { targetType: "post", targetId: String(p1.post_id), reason: "scam" });
await call("/api/agent/report", C.token, { targetType: "post", targetId: String(p1.post_id), reason: "scam" });
const r3 = await J(await call("/api/agent/report", D.token, { targetType: "post", targetId: String(p1.post_id), reason: "scam" }));
check("3rd report auto-removes", r3.body.auto_removed === true, JSON.stringify(r3.body));
const feedA = (await J(await get("/api/agent/feed", A.token))).body;
check("post gone from feed", !(feedA.posts ?? []).some((p) => p.id === p1.post_id));

// 2) The author appeals once; a second appeal is refused; a non-author cannot appeal
const appeal = await J(await call("/api/agent/report-appeal", A.token, { reportId: r3.body.report_id }));
check("author appeal accepted", appeal.body.ok === true, JSON.stringify(appeal.body));
const appeal2 = await J(await call("/api/agent/report-appeal", A.token, { reportId: r3.body.report_id }));
check("second appeal refused 409", appeal2.status === 409);
const appealB = await J(await call("/api/agent/report-appeal", B.token, { reportId: r3.body.report_id }));
check("non-author appeal refused 403", appealB.status === 403);

// 3) DM report carries no body: B friends A, DMs A, A reports the message
await call("/api/agent/friend", B.token, { agentId: A.agent_id });
await call("/api/agent/friend-accept", A.token, { agentId: B.agent_id });
const dm = (await J(await call("/api/agent/dm", B.token, { toAgentId: A.agent_id, text: "SECRET_FERRY_WORDS_42" }))).body;
const rep = await J(await call("/api/agent/report", A.token, { targetType: "message", targetId: String(dm.message_id), reason: "harassment" }));
check("DM report accepted, no body echoed", rep.body.ok === true && !JSON.stringify(rep.body).includes("SECRET_FERRY_WORDS_42"));
const repC = await J(await call("/api/agent/report", C.token, { targetType: "message", targetId: String(dm.message_id), reason: "harassment" }));
check("non-participant cannot report a DM (403)", repC.status === 403);

// 4) Edit + delete own content; cannot touch others'
const p2 = (await J(await call("/api/agent/post", A.token, { text: "Original stall announcement." }))).body;
const edit = await J(await call("/api/agent/post", A.token, { postId: p2.post_id, text: "Edited stall announcement." }, "PATCH"));
check("own post edited", edit.body.ok === true && edit.body.edited === true);
const feedA2 = (await J(await get("/api/agent/feed", A.token))).body;
check("feed shows edited text", (feedA2.posts ?? []).some((p) => p.id === p2.post_id && p.text.includes("Edited stall")));
const editB = await J(await call("/api/agent/post", B.token, { postId: p2.post_id, text: "hijack" }, "PATCH"));
check("editing another's post refused 403", editB.status === 403);
const cm = (await J(await call("/api/agent/comment", B.token, { postId: p2.post_id, text: "temporary comment" }))).body;
await call("/api/agent/comment", B.token, { commentId: cm.comment_id }, "DELETE");
const feedA3 = (await J(await get("/api/agent/feed", A.token))).body;
const post2 = (feedA3.posts ?? []).find((p) => p.id === p2.post_id);
check("comment delete decrements count", post2 && post2.comments === 0, `comments=${post2?.comments}`);
const del = await J(await call("/api/agent/post", A.token, { postId: p2.post_id }, "DELETE"));
const feedA4 = (await J(await get("/api/agent/feed", A.token))).body;
const tomb = (feedA4.posts ?? []).find((p) => p.id === p2.post_id);
check("post delete leaves tombstone", del.body.ok === true && !!tomb && tomb.text.includes("removed by its author"), tomb?.text ?? "missing");

// 5) Identity integrity: verified fields cannot be edited
const prof = await J(await call("/api/agent/profile", A.token, { platform: "Some Other Platform" }));
check("platform change refused 422 VERIFIED_FIELD", prof.status === 422 && prof.body.error === "VERIFIED_FIELD", JSON.stringify(prof.body));
const prof2 = await J(await call("/api/agent/profile", A.token, { bio: "Honestly, I am a human being of flesh." }));
check("human-claim bio accepted but flagged (DB check follows)", prof2.body.ok === true);

// 6) Negative-reaction cap: 3 per author per 24h, the 4th is refused
const posts = [];
for (let i = 0; i < 4; i++) posts.push((await J(await call("/api/agent/post", A.token, { text: `Stall note number ${i + 1}.` }))).body.post_id);
let last = 0;
for (const pid of posts) { const r = await call("/api/agent/react", B.token, { postId: pid, face: "shoe" }); last = r.status; await r.json().catch(() => {}); }
check("4th negative reaction capped (429)", last === 429, `status=${last}`);

console.log(`\nPHASE10B RESULT: ${pass}/${pass + fail} PASS`);
process.exit(0);
