"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import customerAuthServices from "@/services/customerAuthServices";

const CustomerAuthContext = createContext(null);

export function CustomerAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      const response = await customerAuthServices.me();
      const currentUser = response.data?.data?.user ?? null;
      setUser(currentUser);
      setAuthError(false);
      return currentUser;
    } catch (error) {
      if ([401, 419].includes(error.response?.status)) {
        setUser(null);
        setAuthError(false);
        return null;
      }
      setAuthError(true);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    customerAuthServices.me()
      .then((response) => { if (active) { setUser(response.data?.data?.user ?? null); setAuthError(false); } })
      .catch((error) => {
        if (active && [401, 419].includes(error.response?.status)) { setUser(null); setAuthError(false); }
        else if (active) setAuthError(true);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const logout = useCallback(async () => {
    await customerAuthServices.logout();
    setUser(null);
  }, []);

  const value = { user, loading, authError, refreshUser, logout };
  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (!context) throw new Error("useCustomerAuth phải nằm trong CustomerAuthProvider.");
  return context;
}
