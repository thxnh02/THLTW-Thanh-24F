"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import axiosClient from '@/lib/axiosClient';

const Context = createContext({ shop_name: 'CT_24F' });
export const useShopSettings = () => useContext(Context);

export function ShopSettingsProvider({ children }) {
  const [settings, setSettings] = useState({ shop_name: 'CT_24F' });
  useEffect(() => {
    let active = true;
    axiosClient.get('/site-settings').then(({ data }) => { if (active) setSettings(data.data); }).catch(() => {});
    return () => { active = false; };
  }, []);
  return <Context.Provider value={settings}>{children}</Context.Provider>;
}
