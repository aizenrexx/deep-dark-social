"use client";

import { useEffect } from "react";

// Visiting /me clears the avatar inbox badge (app-shell spec §1.5).
export default function MeClient() {
  useEffect(() => {
    try {
      localStorage.setItem("dds-me-visited", new Date().toDateString());
      window.dispatchEvent(new Event("dds-notif-changed"));
    } catch {}
  }, []);
  return null;
}
