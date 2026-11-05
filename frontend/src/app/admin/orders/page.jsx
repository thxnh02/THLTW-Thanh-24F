"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminTable from "@/components/admin/AdminTable";
import OrderStatusBadge from "@/components/admin/OrderStatusBadge";
import Pagination from "@/components/common/Pagination";
import orderServices from "@/services/orderServices";
import { downloadErrorMessage, saveBlobDownload } from "@/lib/downloadFile";
import { getPaymentLabel } from "@/lib/orderPresentation";

export default function OrdersPage() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exportError, setExportError] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let current = true;
    orderServices.getOrders({ page, ...(query ? { q: query } : {}), ...(status ? { status } : {}), ...(paymentStatus ? { payment_status: paymentStatus } : {}), ...(createdFrom ? { created_from: createdFrom } : {}), ...(createdTo ? { created_to: createdTo } : {}) }).then(({ data }) => {
      if (current) { setRows(data.data); setMeta(data.meta); setError(""); }
    }).catch((requestError) => {
      if (current) setError(requestError.response?.data?.message ?? "Không thể tải đơn hàng.");
    }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [page, status, paymentStatus, createdFrom, createdTo, query, retry]);

  const exportCsv = async () => {
    setExporting(true); setExportError("");
    try {
      const response = await orderServices.exportCsv({ ...(query ? { q: query } : {}), ...(status ? { status } : {}), ...(paymentStatus ? { payment_status: paymentStatus } : {}), ...(createdFrom ? { created_from: createdFrom } : {}), ...(createdTo ? { created_to: createdTo } : {}) });
      saveBlobDownload(response.data, 'ct24f-danh-sach-don.csv');
    } catch (requestError) {
      setExportError(await downloadErrorMessage(requestError, "Không thể xuất danh sách đơn hàng."));
    } finally { setExporting(false); }
  };

  const columns = [
    { key: "id", label: "Mã đơn", render: (row) => `#${row.id}` },
    { key: "user", label: "Người dùng", render: (row) => <span><span className="block font-semibold text-slate-900">{row.user?.name ?? "—"}</span><span className="block text-xs text-slate-500">{row.user?.email ?? ""}</span></span> },
    { key: "items", label: "Sản phẩm đã mua", render: (row) => {
      const items = Array.isArray(row.items) ? row.items : [];
      if (!items.length) return <span className="text-slate-400">Đơn cũ chưa lưu sản phẩm</span>;

      return <div className="max-w-xs space-y-1.5">{items.map((item, index) => <p className="leading-5" key={item.id ?? `${item.product_name}-${index}`}>
        <span className="font-medium text-slate-900">{item.product_name ?? "Sản phẩm"}</span>
        <span className="ml-1 text-xs text-slate-500">× {item.quantity ?? 1}</span>
      </p>)}</div>;
    } },
    { key: "status", label: "Trạng thái", render: (row) => <OrderStatusBadge status={row.status} /> },
    { key: "payment", label: "Thanh toán", render: (row) => row.payment_review_required ? <strong className="text-amber-800">Cần xem giao dịch trùng / đến muộn</strong> : row.payment_status === 'needs_review' ? <strong className="text-amber-800">{getPaymentLabel(row)}</strong> : getPaymentLabel(row) },
    { key: "created_at", label: "Ngày tạo", render: (row) => new Date(row.created_at).toLocaleString("vi-VN") },
  ];

  return <section className="space-y-5"><header><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Quản lý đơn hàng</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">Đơn hàng</h1><p className="mt-2 text-sm text-slate-600">Theo dõi trạng thái đơn hàng đã có trong database.</p></header><form className="flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); setPage(1); setQuery(draft.trim()); }}><label className="text-sm font-medium">Tìm đơn hàng<input className="admin-input mt-1 block" maxLength={100} onChange={(event) => setDraft(event.target.value)} placeholder="Mã đơn, tên, email hoặc số điện thoại" value={draft} /></label><button className="min-h-11 rounded-lg bg-indigo-700 px-4 text-sm font-semibold text-white" type="submit">Tìm kiếm</button></form><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><label className="text-sm font-medium text-slate-700">Lọc trạng thái<select className="admin-input mt-1" value={status} onChange={(event) => { setLoading(true); setPage(1); setStatus(event.target.value); }}><option value="">Tất cả</option><option value="pending">Chờ xử lý</option><option value="processing">Đang xử lý</option><option value="shipping">Đang giao</option><option value="delivered">Đã giao</option><option value="cancelled">Đã hủy</option></select></label><label className="text-sm font-medium text-slate-700">Lọc thanh toán<select className="admin-input mt-1" value={paymentStatus} onChange={(event) => { setLoading(true); setPage(1); setPaymentStatus(event.target.value); }}><option value="">Tất cả</option><option value="needs_review">Cần đối soát</option><option value="pending">Đang chờ</option><option value="failed">Thất bại</option><option value="paid">VNPay đã xác nhận</option><option value="demo_paid">COD cũ</option></select></label><label className="text-sm font-medium text-slate-700">Từ ngày<input className="admin-input mt-1" onChange={(event) => { setLoading(true); setPage(1); setCreatedFrom(event.target.value); }} type="date" value={createdFrom} /></label><label className="text-sm font-medium text-slate-700">Đến ngày<input className="admin-input mt-1" onChange={(event) => { setLoading(true); setPage(1); setCreatedTo(event.target.value); }} type="date" value={createdTo} /></label></div><div className="flex flex-wrap items-center gap-3"><button className="min-h-11 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-50" disabled={exporting} onClick={exportCsv} type="button">{exporting ? "Đang xuất…" : "Xuất danh sách đơn hàng (CSV / Excel)"}</button>{exportError && <p className="text-sm text-rose-700" role="alert">{exportError}</p>}</div><AdminTable columns={columns} data={rows} emptyMessage="Chưa có đơn hàng nào." error={error} loading={loading} onRetry={() => { setLoading(true); setRetry((value) => value + 1); }} renderActions={(row) => <><Link className="rounded-lg bg-indigo-50 px-3 text-sm font-semibold text-indigo-800 hover:bg-indigo-100" href={`/admin/orders/${row.id}`}>Chi tiết</Link>{row.allowed_next_statuses?.length > 0 && <Link className="rounded-lg bg-amber-50 px-3 text-sm font-semibold text-amber-800 hover:bg-amber-100" href={`/admin/orders/${row.id}/status`}>Cập nhật</Link>}</>} /><Pagination meta={meta} onPageChange={(next) => { setLoading(true); setPage(next); }} /></section>;
}
