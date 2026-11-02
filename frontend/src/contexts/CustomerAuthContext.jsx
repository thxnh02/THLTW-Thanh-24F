"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import customerAuthServices from "@/services/customerAuthServices";

const CustomerAuthContext = createContext(null);

export function CustomerAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await customerAuthServices.me();
      const currentUser = response.data?.data?.user ?? null;
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      if ([401, 419].includes(error.response?.status)) {
        setUser(null);
        return null;
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    customerAuthServices.me()
      .then((response) => { if (active) setUser(response.data?.data?.user ?? null); })
      .catch((error) => {
        if (active && [401, 419].includes(error.response?.status)) setUser(null);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const logout = useCallback(async () => {
    await customerAuthServices.logout();
    setUser(null);
  }, []);

  const value = { user, loading, refreshUser, logout };
  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (!context) throw new Error("useCustomerAuth phải nằm trong CustomerAuthProvider.");
  return context;
}
