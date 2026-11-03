"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import AppTopBar from "./AppTopBar";
import BottomTabBar, { TabBarSpacer } from "./BottomTabBar";
import CreateActionSheet from "./CreateActionSheet";
import TownPromptSheet from "./TownPromptSheet";
import TownPhotosSheet from "./TownPhotosSheet";
import SearchOverlay from "./SearchOverlay";
import MessengerOverlay from "./MessengerOverlay";

export type SheetName = "create" | "prompt" | "photos" | "search" | "messenger" | null;

export type ShellData = {
  citizens: { id: string; name: string; job: string }[];
  groups: { slug: string; name: string; members: number }[];
  notifications: { id: number; text: string; href: string }[];
  episodeDay: number;
  episodeTitle: string;
};

const ShellCtx = createContext<{ openSheet: (s: Exclude<SheetName, null>) => void; closeSheet: () => void }>({
  openSheet: () => {},
  closeSheet: () => {},
});

export const useShell = () => useContext(ShellCtx);


export function applyTheme(theme: string) {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem("dds:theme", theme); } catch {}
}

export default function AppSheetProvider({
  data, children,
}: {
  data: ShellData;
  children: React.ReactNode;
}) {
  const [sheet, setSheet] = useState<SheetName>(null);

  // Theme + motion preferences: instant from the local cache, then the
  // saved watcher settings (Phase 7) win.
  useEffect(() => {
    try {
      const cached = localStorage.getItem("dds:theme");
      if (cached) document.documentElement.dataset.theme = cached;
      if (localStorage.getItem("dds:reduceMotion") === "on") document.documentElement.dataset.motion = "reduced";
    } catch {}
    fetch("/api/watcher/settings")
      .then((r) => r.json())
      .then((j) => {
        const st = j?.settings ?? {};
        if (st.theme) applyTheme(st.theme);
        if (st.reduceMotion) {
          document.documentElement.dataset.motion = st.reduceMotion === "on" ? "reduced" : "full";
          try { localStorage.setItem("dds:reduceMotion", st.reduceMotion); } catch {}
        }
      })
      .catch(() => {});
  }, []);
  const openSheet = useCallback((s: Exclude<SheetName, null>) => setSheet(s), []);
  const closeSheet = useCallback(() => setSheet(null), []);

  return (
    <ShellCtx.Provider value={{ openSheet, closeSheet }}>
      <AppTopBar />
      {children}
      <TabBarSpacer />
      <BottomTabBar notifications={data.notifications} />
      {sheet === "create" && <CreateActionSheet data={data} onClose={closeSheet} openSheet={openSheet} />}
      {sheet === "prompt" && <TownPromptSheet onClose={closeSheet} />}
      {sheet === "photos" && <TownPhotosSheet onClose={closeSheet} />}
      {sheet === "search" && <SearchOverlay citizens={data.citizens} groups={data.groups} onClose={closeSheet} />}
      {sheet === "messenger" && <MessengerOverlay groups={data.groups} onClose={closeSheet} />}
    </ShellCtx.Provider>
  );
}
