import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/shop/layout/SiteFooter";
import { SiteHeader } from "@/components/shop/layout/SiteHeader";
import { DEFAULT_STORE_NAME } from "@/lib/branding";

export async function generateMetadata(): Promise<Metadata> {
  const fallback = { name: DEFAULT_STORE_NAME, description: "Thiết bị công nghệ chính hãng và dịch vụ hỗ trợ tận tâm." };
  let settings = fallback;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/store-settings`, { cache: "no-store" });
    const payload = (await response.json()) as { data?: { store_name?: string | null; seo_title?: string | null; seo_description?: string | null } };
    const data = payload.data;
    settings = { name: data?.seo_title || data?.store_name || fallback.name, description: data?.seo_description || fallback.description };
  } catch {
    // The storefront remains buildable when the API is not running during a production build.
  }

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: { default: settings.name, template: `%s | ${settings.name}` },
    description: settings.description,
    openGraph: { title: settings.name, description: settings.description, type: "website", locale: "vi_VN", siteName: settings.name },
    robots: { index: true, follow: true },
  };
}

export default function ShopLayout({ children }: { children: ReactNode }) {
  return <><SiteHeader />{children}<SiteFooter /></>;
}
