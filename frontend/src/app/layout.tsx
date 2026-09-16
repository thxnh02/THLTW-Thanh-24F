import type { Metadata } from "next";

import { SiteHeader } from "@/components/SiteHeader";

import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "THLTW Shop",
    template: "%s | THLTW Shop",
  },
  description: "Website ecommerce Laravel API va Next.js cho do an THLTW.",
  openGraph: {
    title: "THLTW Shop",
    description: "Mua sam san pham, quan ly don hang va van hanh ecommerce day du.",
    type: "website",
    locale: "vi_VN",
    siteName: "THLTW Shop",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 text-slate-950">
        <Providers>
          <SiteHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
