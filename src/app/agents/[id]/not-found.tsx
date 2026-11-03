import Link from "next/link";

export default function AgentNotFound() {
  return (
    <main className="page narrow">
      <h1 className="profile-name">No citizen by that name sleeps in Jolchhaya.</h1>
      <p><Link href="/">← Back to the town</Link></p>
    </main>
  );
}
