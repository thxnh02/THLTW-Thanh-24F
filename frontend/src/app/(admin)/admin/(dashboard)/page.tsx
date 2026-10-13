"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, ArrowRight, BadgeDollarSign, CheckCircle2, Clock3, PackagePlus, ShoppingBag, Truck, Users } from "lucide-react";

import { ErrorState, PageHeader, SectionCard, Skeleton } from "@/components/ui";
import { roleLabel } from "@/components/admin/layout/AdminHeader";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/services/http";
import { reportAdminService } from "@/services/admin/reportAdminService";
import { canSee } from "@/lib/admin/adminPermissions";
import { formatVnd } from "@/utils/format";

type Dashboard = { revenue_today?: number; revenue_month?: number; total_orders?: number; pending_orders?: number; shipping_orders?: number; completed_orders?: number; total_members?: number; low_stock_products?: number };
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
  { label: "Sản phẩm", href: "/admin/products", permission: "catalog", icon: PackagePlus },
  { label: "Đơn hàng", href: "/admin/orders", permission: "orders", icon: ShoppingBag },
  { label: "Tồn kho", href: "/admin/stock", permission: "stock", icon: AlertTriangle },
  { label: "Khuyến mãi", href: "/admin/promotions", permission: "promotions", icon: BadgeDollarSign },
  { label: "Khách hàng", href: "/admin/users", permission: "users", icon: Users },
  { label: "Báo cáo", href: "/admin/reports", permission: "reports", icon: ArrowRight },
] as const;

const toneClasses: Record<MetricTone, string> = { teal: "bg-teal-50 text-teal-700", blue: "bg-blue-50 text-blue-700", amber: "bg-amber-50 text-amber-700", indigo: "bg-indigo-50 text-indigo-700", emerald: "bg-emerald-50 text-emerald-700", violet: "bg-violet-50 text-violet-700", orange: "bg-orange-50 text-orange-700" };

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    reportAdminService.dashboard<Dashboard>().then(setDashboard).catch((reason: Error) => {
      if (reason instanceof ApiError && reason.status === 401) router.push("/admin/login");
      else setError("Không thể tải tổng quan cửa hàng. Vui lòng thử lại.");
    });
  }, [router]);

  const allowedLinks = quickLinks.filter((item) => canSee(user?.role, item.permission));
  const alerts = dashboard ? [
    dashboard.pending_orders ? { text: `${dashboard.pending_orders} đơn hàng đang chờ xác nhận`, href: "/admin/orders", tone: "amber" } : null,
    dashboard.low_stock_products ? { text: `${dashboard.low_stock_products} sản phẩm sắp hết hàng`, href: "/admin/stock", tone: "orange" } : null,
  ].filter(Boolean) as Array<{ text: string; href: string; tone: "amber" | "orange" }> : [];

  return <main className="mx-auto max-w-7xl px-4 py-8"><PageHeader eyebrow="Quản trị cửa hàng" title="Tổng quan" description="Theo dõi doanh thu, đơn hàng, thành viên và tồn kho từ dữ liệu thực tế." action={<Link href="/admin/orders" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-teal-800"><ShoppingBag size={17} aria-hidden="true" />Xem đơn hàng</Link>} /><p className="-mt-3 mb-6 text-sm text-slate-500">Xin chào, {user ? `${user.name} · ${roleLabel(user.role)}` : ""}</p>{error ? <ErrorState message={error} /> : null}{!dashboard && !error ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <Skeleton key={index} className="h-32" />)}</div> : null}{dashboard ? <><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{metrics.map((metric) => <Metric key={metric.key} label={metric.label} value={metric.money ? formatVnd(dashboard[metric.key] as number) : String(dashboard[metric.key] ?? 0)} icon={metric.icon} tone={metric.tone} />)}</div><div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]"><SectionCard><div className="flex items-center justify-between gap-4"><div><h2 className="font-bold text-slate-950">Thao tác nhanh</h2><p className="mt-1 text-sm text-slate-600">Đi tới các công việc thường dùng theo quyền của bạn.</p></div></div><div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{allowedLinks.map(({ label, href, icon: Icon }) => <Link key={href} href={href} className="flex min-h-14 items-center justify-between gap-3 rounded-lg border border-[var(--border)] px-3.5 text-sm font-semibold text-slate-800 transition hover:border-teal-500 hover:bg-teal-50 hover:text-teal-900"><span className="flex items-center gap-2"><Icon size={17} className="text-teal-700" aria-hidden="true" />{label}</span><ArrowRight size={16} aria-hidden="true" /></Link>)}</div></SectionCard><SectionCard><h2 className="font-bold text-slate-950">Cần chú ý</h2>{alerts.length ? <div className="mt-4 space-y-2">{alerts.map((alert) => <Link key={alert.href} href={alert.href} className={`flex items-center gap-3 rounded-lg p-3 text-sm font-semibold ${alert.tone === "amber" ? "bg-amber-50 text-amber-900" : "bg-orange-50 text-orange-900"}`}><AlertTriangle size={17} aria-hidden="true" />{alert.text}</Link>)}</div> : <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Hiện chưa có việc nào cần xử lý ngay.</p>}</SectionCard></div></> : null}</main>;
}

function Metric({ label, value, icon: Icon, tone }: { label: string; value: string; icon: LucideIcon; tone: MetricTone }) { return <SectionCard className="relative overflow-hidden"><div className={`mb-5 flex size-10 items-center justify-center rounded-lg ${toneClasses[tone]}`}><Icon size={19} aria-hidden="true" /></div><p className="text-sm font-medium text-slate-600">{label}</p><p className="mt-1 text-2xl font-bold text-slate-950">{value}</p></SectionCard>; }
