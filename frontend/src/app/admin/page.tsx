"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, apiGet } from "@/lib/api";
import { formatVnd } from "@/lib/format";

type Dashboard = Record<string, number | string | unknown[]>;

export default function AdminPage() {
  const router = useRouter();
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

        setError(reason.message);
      });
  }, [router]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Admin dashboard</h1>
          <p className="mt-2 text-slate-600">Tong quan don hang, doanh thu, thanh vien va ton kho.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/categories" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">
            Danh muc
          </Link>
          <Link href="/admin/brands" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">
            Thuong hieu
          </Link>
          <Link href="/admin/products" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">
            San pham
          </Link>
          <Link href="/admin/promotions" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">
            Khuyen mai
          </Link>
          <Link href="/admin/orders" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">
            Don hang
          </Link>
          <Link href="/admin/users" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">
            Thanh vien
          </Link>
          <Link href="/admin/posts" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">
            Bai viet
          </Link>
          <Link href="/admin/post-categories" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">
            Chu de
          </Link>
          <Link href="/admin/pages" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">
            Trang
          </Link>
          <Link href="/admin/menus" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">
            Menu
          </Link>
          <Link href="/admin/banners" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">
            Banner
          </Link>
          <Link href="/admin/contacts" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">
            Lien he
          </Link>
          <Link href="/admin/settings" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">
            Cau hinh
          </Link>
          <Link href="/admin/stock" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">
            Kho
          </Link>
          <Link href="/admin/media" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">
            Anh
          </Link>
        </div>
      </div>
      {error ? <p className="rounded-md bg-white p-4 text-red-600">{error}</p> : null}
      {!dashboard ? <p className="rounded-md bg-white p-4">Dang tai dashboard...</p> : null}
      {dashboard ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Doanh thu hom nay" value={formatVnd(dashboard.revenue_today as number)} />
          <Metric label="Doanh thu thang" value={formatVnd(dashboard.revenue_month as number)} />
          <Metric label="Tong don" value={String(dashboard.total_orders ?? 0)} />
          <Metric label="Cho xac nhan" value={String(dashboard.pending_orders ?? 0)} />
          <Metric label="Dang giao" value={String(dashboard.shipping_orders ?? 0)} />
          <Metric label="Hoan thanh" value={String(dashboard.completed_orders ?? 0)} />
          <Metric label="Thanh vien" value={String(dashboard.total_members ?? 0)} />
          <Metric label="Sap het hang" value={String(dashboard.low_stock_products ?? 0)} />
        </div>
      ) : null}
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}
