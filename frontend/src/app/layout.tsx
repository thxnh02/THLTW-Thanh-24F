import type { ReactNode } from "react";

import { AppProviders } from "@/providers/AppProviders";

import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 text-slate-950">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
