"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, apiGet } from "@/lib/api";
import { formatVnd } from "@/lib/format";
import { ErrorState, PageHeader, SectionCard, Skeleton } from "@/components/ui";
import { roleLabel } from "@/components/AdminShell";
import { useAuth } from "@/contexts/AuthContext";

type Dashboard = Record<string, number | string | unknown[]>;

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet<Dashboard>("/admin/dashboard")
      .then(setDashboard)
      .catch((reason: Error) => {
        if (reason instanceof ApiError && reason.status === 401) {
          router.push("/admin/login");
          return;
        }

        setError("Không thể tải tổng quan cửa hàng. Vui lòng thử lại.");
      });
  }, [router]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader eyebrow="Quản trị cửa hàng" title="Tổng quan" description="Theo dõi doanh thu, đơn hàng, thành viên và tồn kho từ dữ liệu thực tế." action={<Link href="/admin/orders" className="inline-flex min-h-11 items-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-teal-800">Xem đơn hàng</Link>} />
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm text-slate-500">Xin chào, {user ? `${user.name} · ${roleLabel(user.role)}` : ""}</span>
          {quickLinks.filter((item) => canSee(user?.role, item.permission)).map((item) => <Link key={item.href} href={item.href} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold hover:border-teal-700 hover:text-teal-800">{item.label}</Link>)}
        </div>
      {error ? <ErrorState message={error} /> : null}
      {!dashboard && !error ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-28" />)}</div> : null}
      {dashboard ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Doanh thu hôm nay" value={formatVnd(dashboard.revenue_today as number)} />
          <Metric label="Doanh thu tháng" value={formatVnd(dashboard.revenue_month as number)} />
          <Metric label="Tổng đơn hàng" value={String(dashboard.total_orders ?? 0)} />
          <Metric label="Chờ xác nhận" value={String(dashboard.pending_orders ?? 0)} />
          <Metric label="Đang giao" value={String(dashboard.shipping_orders ?? 0)} />
          <Metric label="Hoàn thành" value={String(dashboard.completed_orders ?? 0)} />
          <Metric label="Thành viên" value={String(dashboard.total_members ?? 0)} />
          <Metric label="Sắp hết hàng" value={String(dashboard.low_stock_products ?? 0)} />
        </div>
      ) : null}
    </main>
  );
}

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

function canSee(role: string | undefined, permission: string): boolean {
  if (!role) return false;
  if (role === "admin") return true;
  const permissions: Record<string, string[]> = {
    manager: ["dashboard", "reports", "catalog", "promotions", "orders", "returns", "shipping", "stock", "content", "contacts"],
    staff: ["orders", "returns", "stock", "contacts"],
  };
  return permissions[role]?.includes(permission) ?? false;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <SectionCard>
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
    </SectionCard>
  );
}
