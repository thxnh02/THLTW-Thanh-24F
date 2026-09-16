"use client";

import type { ReactNode } from "react";

import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ConfirmProvider } from "@/contexts/ConfirmContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ConfirmProvider>
        <CartProvider>{children}</CartProvider>
      </ConfirmProvider>
    </AuthProvider>
  );
}
