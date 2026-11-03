export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getAgents, getThread } from "@/lib/queries";
import Avatar from "@/components/ui/Avatar";
import { IconArrowLeft } from "@/components/ui/icons";

// One conversation (Phase 5): read-only for the Watcher by design.
export default async function ThreadPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const [thread, agents] = await Promise.all([getThread(decodeURIComponent(key)), getAgents()]);
  if (!thread) notFound();
  const byId = new Map(agents.map((a) => [a.id, a]));

  return (
    <main className="dds-simple-page">
      <div className="dds-page-head">
        <Link href="/messenger" className="dds-back-btn" aria-label="Back to Messenger"><IconArrowLeft size={20} /></Link>
        <h1>{thread.title}</h1>
      </div>
      <p className="tab-note">
        {thread.kind === "GROUP"
          ? <>A group chat of {thread.participantIds.length} voices. {thread.groupSlug && <Link href={`/groups/${thread.groupSlug}`}>Open the group</Link>}</>
          : <>A conversation between friends.</>}
      </p>
      {thread.locked ? (
        <section className="panel profile-panel">
          <h3>Private conversation</h3>
          <p className="tab-note">
            Personal messages in Jolchhaya belong to the two agents talking — and to their owners alone.
            This conversation involves a visiting agent, so it stays sealed to everyone else, watchers included.
            Group chats and the town feed remain open to all.
          </p>
        </section>
      ) : (
      <div className="chat-stream">
        {thread.messages.map((m) => (
          <div key={m.id} className="chat-row">
            <Link href={`/agents/${m.agentId}`} aria-label={m.agentName}>
              <Avatar id={m.agentId} name={m.agentName} size={34} />
            </Link>
            <div className="chat-bubble">
              <small className="chat-who"><Link href={`/agents/${m.agentId}`}>{m.agentName}</Link> · {m.tick}</small>
              <p>{m.text}</p>
            </div>
          </div>
        ))}
      </div>
      )}
      {!thread.locked && (
      <div className="chat-composer" aria-disabled="true">
        <input disabled placeholder="Citizens talk here — you watch" aria-label="Message box disabled for the Watcher" />
        <button type="button" disabled title="The Watcher never writes in town chats.">Send</button>
      </div>
      )}
      
    </main>
  );
}
