"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, BadgeDollarSign, CheckCircle2, Clock3, ShoppingBag, Truck, Users } from "lucide-react";

import { ErrorState, PageHeader, SectionCard, Skeleton } from "@/components/ui";
import { roleLabel } from "@/components/admin/layout/AdminShell";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError, apiGet } from "@/lib/api";
import { canSee } from "@/lib/admin/adminPermissions";
import { formatVnd } from "@/lib/format";

type Dashboard = {
  revenue_today?: number;
  revenue_month?: number;
  total_orders?: number;
  pending_orders?: number;
  shipping_orders?: number;
  completed_orders?: number;
  total_members?: number;
  low_stock_products?: number;
};

type MetricTone = "teal" | "blue" | "amber" | "indigo" | "emerald" | "violet" | "orange";

const metrics: Array<{ key: keyof Dashboard; label: string; icon: LucideIcon; tone: MetricTone; money?: boolean }> = [
  { key: "revenue_today", label: "Doanh thu hôm nay", icon: BadgeDollarSign, tone: "teal", money: true },
  { key: "revenue_month", label: "Doanh thu tháng", icon: BadgeDollarSign, tone: "blue", money: true },
  { key: "total_orders", label: "Tổng đơn hàng", icon: ShoppingBag, tone: "indigo" },
  { key: "pending_orders", label: "Chờ xác nhận", icon: Clock3, tone: "amber" },
  { key: "shipping_orders", label: "Đang giao", icon: Truck, tone: "blue" },
  { key: "completed_orders", label: "Hoàn thành", icon: CheckCircle2, tone: "emerald" },
  { key: "total_members", label: "Thành viên", icon: Users, tone: "violet" },
  { key: "low_stock_products", label: "Sắp hết hàng", icon: AlertTriangle, tone: "orange" },
];

const quickLinks = [
  { label: "Danh mục", href: "/admin/categories", permission: "catalog" },
  { label: "Thương hiệu", href: "/admin/brands", permission: "catalog" },
  { label: "Sản phẩm", href: "/admin/products", permission: "catalog" },
  { label: "Nhập CSV", href: "/admin/import/products", permission: "catalog" },
  { label: "Khuyến mãi", href: "/admin/promotions", permission: "promotions" },
  { label: "Đơn hàng", href: "/admin/orders", permission: "orders" },
  { label: "Đổi trả", href: "/admin/returns", permission: "returns" },
  { label: "Thành viên", href: "/admin/users", permission: "users" },
  { label: "Vận chuyển", href: "/admin/shipping-methods", permission: "shipping" },
  { label: "Báo cáo", href: "/admin/reports", permission: "reports" },
  { label: "Kho", href: "/admin/stock", permission: "stock" },
  { label: "Bài viết", href: "/admin/posts", permission: "content" },
  { label: "Chủ đề", href: "/admin/post-categories", permission: "content" },
  { label: "Trang", href: "/admin/pages", permission: "content" },
  { label: "Menu", href: "/admin/menus", permission: "content" },
  { label: "Banner", href: "/admin/banners", permission: "content" },
  { label: "Liên hệ", href: "/admin/contacts", permission: "contacts" },
  { label: "Thư viện ảnh", href: "/admin/media", permission: "content" },
  { label: "Cấu hình", href: "/admin/settings", permission: "settings" },
] as const;

const toneClasses: Record<MetricTone, string> = {
  teal: "bg-teal-50 text-teal-700",
  blue: "bg-blue-50 text-blue-700",
  amber: "bg-amber-50 text-amber-700",
  indigo: "bg-indigo-50 text-indigo-700",
  emerald: "bg-emerald-50 text-emerald-700",
  violet: "bg-violet-50 text-violet-700",
  orange: "bg-orange-50 text-orange-700",
};

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet<Dashboard>("/admin/dashboard").then(setDashboard).catch((reason: Error) => {
      if (reason instanceof ApiError && reason.status === 401) router.push("/admin/login");
      else setError("Không thể tải tổng quan cửa hàng. Vui lòng thử lại.");
    });
  }, [router]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader eyebrow="Quản trị cửa hàng" title="Tổng quan" description="Theo dõi doanh thu, đơn hàng, thành viên và tồn kho từ dữ liệu thực tế." action={<Link href="/admin/orders" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-teal-800"><ShoppingBag size={17} aria-hidden="true" /> Xem đơn hàng</Link>} />
      <div className="mb-6 flex flex-wrap items-center gap-2"><span className="mr-1 text-sm text-slate-500">Xin chào, {user ? `${user.name} · ${roleLabel(user.role)}` : ""}</span>{quickLinks.filter((item) => canSee(user?.role, item.permission)).map((item) => <Link key={item.href} href={item.href} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold transition hover:border-teal-700 hover:text-teal-800">{item.label}</Link>)}</div>
      {error ? <ErrorState message={error} /> : null}
      {!dashboard && !error ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-32" />)}</div> : null}
      {dashboard ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{metrics.map((metric) => <Metric key={metric.key} label={metric.label} value={metric.money ? formatVnd(dashboard[metric.key] as number) : String(dashboard[metric.key] ?? 0)} icon={metric.icon} tone={metric.tone} />)}</div> : null}
    </main>
  );
}

function Metric({ label, value, icon: Icon, tone }: { label: string; value: string; icon: LucideIcon; tone: MetricTone }) {
  return <SectionCard className="relative overflow-hidden"><div className={`mb-5 flex size-10 items-center justify-center rounded-xl ${toneClasses[tone]}`}><Icon size={19} aria-hidden="true" /></div><p className="text-sm font-medium text-slate-600">{label}</p><p className="mt-1 text-2xl font-bold text-slate-950">{value}</p></SectionCard>;
}
