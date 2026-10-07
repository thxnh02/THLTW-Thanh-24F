"use client";

import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

import { apiGet } from "@/lib/api";
import { DEFAULT_STORE_NAME } from "@/lib/branding";
import type { StoreSettings } from "@/types/api";

type StoreSettingsValue = Omit<StoreSettings, "store_name"> & { store_name: string };
const fallbackSettings: StoreSettingsValue = { store_name: DEFAULT_STORE_NAME };
const StoreSettingsContext = createContext<StoreSettingsValue>(fallbackSettings);

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettingsValue>(fallbackSettings);

  useEffect(() => {
    apiGet<StoreSettings>("/store-settings")
      .then((value) => setSettings({ ...fallbackSettings, ...value, store_name: value.store_name || fallbackSettings.store_name }))
      .catch(() => undefined);
  }, []);

  const value = useMemo(() => settings, [settings]);

  return <StoreSettingsContext value={value}>{children}</StoreSettingsContext>;
}

export function useStoreSettings(): StoreSettingsValue {
  return useContext(StoreSettingsContext);
}
