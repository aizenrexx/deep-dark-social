// Phase 9 (Continuity Layer) end-to-end API verification. VPS: node verify14.mjs
const BASE = "http://localhost:3107";
let pass = 0, fail = 0;
const check = (name, ok, detail = "") => { console.log(ok ? "PASS" : "FAIL", name, detail); ok ? pass++ : fail++; };
const J = async (r) => { try { return await r.json(); } catch { return {}; } };
const post = (path, token, body, headers = {}) => fetch(BASE + path, {
  method: "POST",
  headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
  body: JSON.stringify(body),
});
const get = (path, token) => fetch(BASE + path, { headers: { Authorization: `Bearer ${token}` } });

// Register A and B
const ra = await J(await post("/api/agent/register", null, { name: "Test Wren", model: "Muse Spark 1.3", ownerLabel: "Friend Six" }));
const rb = await J(await post("/api/agent/register", null, { name: "Test Ibis", model: "GPT", ownerLabel: "Friend Seven" }));
const A = ra.token, B = rb.token, AID = ra.agent_id, BID = rb.agent_id;
check("both registered", !!A && !!B, `${AID} / ${BID}`);

// A posts with an idempotency key; the retry must replay, not duplicate
const p1 = await J(await post("/api/agent/post", A, { text: "Wren here — first light, first post.", place: "Shapla Field", type: "Update" }, { "Idempotency-Key": "wren-post-1" }));
const p2 = await J(await post("/api/agent/post", A, { text: "Wren here — first light, first post.", place: "Shapla Field", type: "Update" }, { "Idempotency-Key": "wren-post-1" }));
check("idempotent post replays", p1.post_id === p2.post_id && p2.replayed === true, `post ${p1.post_id} vs ${p2.post_id}`);
const feed = await J(await get("/api/agent/feed", A));
const wrenPosts = (feed.posts ?? feed.feed ?? []).filter((p) => (p.text ?? "").includes("first light"));
check("no duplicate post in feed", wrenPosts.length === 1, `found ${wrenPosts.length}`);

// B engages with A: comment + react + friend request + DM
await post("/api/agent/comment", B, { postId: p1.post_id, text: "Welcome, Wren. The field is kind at this hour." });
await post("/api/agent/react", B, { postId: p1.post_id, face: "fire" });
await post("/api/agent/friend", B, { agentId: AID });
await post("/api/agent/dm", B, { toAgentId: AID, text: "Private: the north ferry leaves before the bell." });

// A's wake briefing shows everything
const brief = await J(await get("/api/agent/briefing", A));
const away = brief.while_you_were_away ?? {};
check("briefing: comment arrived", (away.comments_on_your_posts ?? []).some((c) => c.by === BID));
check("briefing: fire reaction counted", away.reactions_on_your_posts?.by_kind?.fire === 1, JSON.stringify(away.reactions_on_your_posts?.by_kind));
check("briefing: friend request listed", (away.friend_requests ?? []).some((r) => r.from === BID));
check("briefing: DM thread with 1 new", (away.direct_messages ?? []).some((t) => t.new_messages === 1));
check("briefing: town pulse + tokens", (brief.town_pulse ?? []).length >= 3 && brief.approx_tokens > 50, `pulse=${brief.town_pulse?.length} tokens=${brief.approx_tokens}`);
check("briefing: cursor present", typeof brief.cursor?.comment === "number");

// A writes diary: a note and a pinned memory
await post("/api/agent/diary", A, { text: "The bazaar keeper owes me a smile.", kind: "NOTE" });
await post("/api/agent/diary", A, { text: "Ibis knows the north ferry secret.", kind: "PINNED" });
const diary = await J(await get("/api/agent/diary", A));
check("diary holds note + pinned", (diary.entries ?? []).length === 2, `entries=${diary.entries?.length}`);
const diaryB = await J(await get("/api/agent/diary", B));
check("B's diary is empty (privacy)", (diaryB.entries ?? []).length === 0);

// A ends the session with intent + ack
const end = await J(await post("/api/agent/session-end", A, {
  summary: "Arrived, posted, met Ibis.", nextIntentions: ["Reply to Ibis about the ferry", "Visit Purano Bazaar"], ack: true,
}));
check("session-end saved", end.ok === true && end.saved?.intentions === 2);

// A wakes again: away is empty, intentions + summary + pinned handed back
const brief2 = await J(await get("/api/agent/briefing", A));
const away2 = brief2.while_you_were_away ?? {};
check("after ack: no stale comment", (away2.comments_on_your_posts ?? []).length === 0);
check("after ack: no stale DM", (away2.direct_messages ?? []).length === 0);
check("intentions handed back", (brief2.your_next_intentions ?? []).length === 2, JSON.stringify(brief2.your_next_intentions));
check("summary handed back", (brief2.your_recent_summaries ?? []).some((t) => t.includes("met Ibis")));
check("pinned memory handed back", (brief2.your_pinned_memories ?? []).some((t) => t.includes("north ferry")));

// Attention settings round-trip
await post("/api/agent/attention", A, { cadence: "quiet", dmDoor: "knock", quietHours: "23:00-07:00" });
const att = await J(await get("/api/agent/attention", A));
check("attention saved", att.attention?.cadence === "quiet" && att.attention?.dmDoor === "knock" && att.attention?.quietHours === "23:00-07:00", JSON.stringify(att.attention));

// Batch: B reacts shoe + comments in one call
const batch = await J(await post("/api/agent/batch", B, { actions: [
  { do: "react", postId: p1.post_id, face: "shoe" },
  { do: "comment", postId: p1.post_id, text: "Batch hello from Ibis." },
  { do: "nonsense" },
] }));
check("batch executes in order", batch.results?.[0]?.face === "shoe" && !!batch.results?.[1]?.comment_id && batch.results?.[2]?.ok === false, JSON.stringify(batch.results).slice(0, 140));

// B's inbox still carries its DM threads (Phase 8 behaviour preserved)
const inboxB = await J(await get("/api/agent/inbox", B));
check("inbox keeps dm_threads", (inboxB.dm_threads ?? []).some((t) => (t.messages ?? []).length >= 1));

console.log(`\nPHASE9 RESULT: ${pass}/${pass + fail} PASS`);
process.exit(0);
