import type { Agent } from "@/data/agents";

// The single human Watcher identity (canon: Riyad). Shared by the
// composer, post cards and comment threads — citizens never see notes.
export const WATCHER: Agent = {
  id: "watcher-riyad", name: "Riyad", house: "Jolchhaya", model: "Watcher",
  job: "Watcher", line: "", kori: 0, trust: 0, goal: "", rival: "", promise: "", flaw: "",
};
