"use client";

import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

import { apiGet } from "@/lib/api";
import type { StoreSettings } from "@/types/api";

const fallbackSettings: StoreSettings = { store_name: "Công Nghệ Việt" };
const StoreSettingsContext = createContext<StoreSettings>(fallbackSettings);

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(fallbackSettings);

  useEffect(() => {
    apiGet<StoreSettings>("/store-settings")
      .then((value) => setSettings({ ...fallbackSettings, ...value }))
      .catch(() => undefined);
  }, []);

  const value = useMemo(() => settings, [settings]);

  return <StoreSettingsContext value={value}>{children}</StoreSettingsContext>;
}

export function useStoreSettings(): StoreSettings {
  return useContext(StoreSettingsContext);
}
