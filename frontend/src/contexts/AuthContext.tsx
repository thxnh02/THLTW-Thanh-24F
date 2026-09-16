"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { apiGet, apiPost } from "@/lib/api";
import type { AuthPayload, User } from "@/types/api";

type AuthContextValue = {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    password_confirmation: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const storeAuth = useCallback((payload: AuthPayload): User => {
    setUser(payload.user);

    return payload.user;
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      setUser(await apiGet<User>("/auth/me"));
    } catch {
      setUser(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(refreshUser);
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string): Promise<User> => {
      const payload = await apiPost<AuthPayload>("/auth/login", { email, password });
      return storeAuth(payload);
    },
    [storeAuth],
  );

  const register = useCallback(
    async (payload: {
      name: string;
      email: string;
      phone?: string;
      password: string;
      password_confirmation: string;
    }): Promise<User> => {
      const response = await apiPost<AuthPayload>("/auth/register", payload);
      return storeAuth(response);
    },
    [storeAuth],
  );

  const logout = useCallback(async () => {
    try {
      await apiPost("/auth/logout", {});
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, ready, login, register, logout, refreshUser }),
    [login, logout, ready, refreshUser, register, user],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
