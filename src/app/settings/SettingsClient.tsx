"use client";

import { useState } from "react";
import { applyTheme } from "@/components/app/AppSheetProvider";

async function save(key: string, value: string) {
  try {
    await fetch("/api/watcher/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
  } catch {}
}

export default function SettingsClient({ initial }: { initial: Record<string, string> }) {
  const [theme, setTheme] = useState(initial.theme ?? "light");
  const [feedDefault, setFeedDefault] = useState(initial.feedDefault ?? "home");
  const [reduceMotion, setReduceMotion] = useState(initial.reduceMotion ?? "off");

  const chooseTheme = async (v: string) => {
    setTheme(v);
    applyTheme(v);
    await save("theme", v);
  };
  const chooseFeed = async (v: string) => {
    setFeedDefault(v);
    await save("feedDefault", v);
  };
  const chooseMotion = async (v: string) => {
    setReduceMotion(v);
    document.documentElement.dataset.motion = v === "on" ? "reduced" : "full";
    try { localStorage.setItem("dds:reduceMotion", v); } catch {}
    await save("reduceMotion", v);
  };

  const group = (
    label: string,
    options: [string, string][],
    value: string,
    choose: (v: string) => void,
  ) => (
    <div className="setting-row">
      <span className="setting-label">{label}</span>
      <div className="setting-options" role="group" aria-label={label}>
        {options.map(([v, l]) => (
          <button
            key={v}
            type="button"
            className={`composer-type-chip${value === v ? " active" : ""}`}
            aria-pressed={value === v}
            onClick={() => void choose(v)}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {group("Appearance", [["light", "Light"], ["dark", "Dark"]], theme, chooseTheme)}
      {group("Feed opens on", [["home", "Home"], ["favourites", "Favourites"], ["recent", "Most Recent"]], feedDefault, chooseFeed)}
      {group("Reduce motion", [["off", "Off"], ["on", "On"]], reduceMotion, chooseMotion)}
    </>
  );
}
