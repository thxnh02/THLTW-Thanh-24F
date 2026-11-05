import ShopHeader from "@/components/shop/ShopHeader";
import ShopFooter from "@/components/shop/ShopFooter";
import { ShopSettingsProvider } from "@/contexts/ShopSettingsContext";
import { CustomerAuthProvider } from "@/contexts/CustomerAuthContext";
import { CartProvider } from "@/contexts/CartContext";

export async function generateMetadata() {
  const origin = (process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
  try {
    const response = await fetch(`${origin}/api/site-settings`, { cache: 'no-store' });
    if (!response.ok) return {};
    const { data } = await response.json();
    return { ...(data.seo_title ? { title: data.seo_title } : {}),
      ...(data.seo_description ? { description: data.seo_description } : {}),
      ...(data.favicon_url ? { icons: { icon: data.favicon_url } } : {}) };
  } catch { return {}; }
}

export default function ShopLayout({ children }) {
  return <ShopSettingsProvider><CustomerAuthProvider><CartProvider><div className="shop-shell min-h-screen">
    <ShopHeader />
    <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
    <ShopFooter />
  </div></CartProvider></CustomerAuthProvider></ShopSettingsProvider>;
}
