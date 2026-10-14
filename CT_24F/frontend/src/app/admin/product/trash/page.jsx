"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import StatusBadge from "@/components/admin/StatusBadge";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import TrashTable from "@/components/admin/TrashTable";
import { runBulkTrashAction } from "@/lib/adminTrashActions.mjs";
import productServices from "@/services/productServices";

// Trang /admin/product/trash: khôi phục hoặc xóa vĩnh viễn sản phẩm đã xóa mềm.
export default function ProductTrashPage() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(null);
  const [bulkConfirming, setBulkConfirming] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [restoreConfirming, setRestoreConfirming] = useState(null);
  const [notice, setNotice] = useState("");

  // Lấy một trang sản phẩm trong thùng rác và thông tin phân trang.
  const load = useCallback((page = 1) => {
    setLoading(true);
    setError("");
    productServices.getProductTrash({ page }).then((response) => {
      setData(response.data.data);
      setMeta(response.data.meta);
    }).catch((requestError) => {
      setError(requestError.response?.data?.message ?? "Không thể tải thùng rác sản phẩm.");
    }).finally(() => setLoading(false));
  }, []);

  const selectedItems = data.filter((item) => selectedIds.includes(String(item.id)));
  const handlePageChange = (page) => {
    setSelectedIds([]);
    load(page);
  };
  // Cập nhật bảng sau thao tác hàng loạt; mục thất bại vẫn được giữ chọn.
  const applyBulkOutcome = (outcome, action) => {
    const succeededIds = new Set(outcome.succeeded.map((item) => String(item.id)));
    setData((current) => current.filter((item) => !succeededIds.has(String(item.id))));
    setSelectedIds(outcome.failed.map((item) => String(item.id)));
    setMeta((current) => current ? { ...current, total: Math.max(0, (current.total ?? 0) - outcome.succeeded.length) } : current);
    setNotice(`${outcome.succeeded.length} mục ${action}; ${outcome.failed.length} mục thất bại. Các mục thất bại vẫn được chọn.`);
    if (data.length <= outcome.succeeded.length && (meta?.current_page ?? 1) > 1) load(meta.current_page - 1);
  };
  // Khôi phục các sản phẩm đã tích chọn.
  const restoreSelected = async () => {
    if (!selectedItems.length || bulkBusy) return;
    setBulkBusy(true);
    const outcome = await runBulkTrashAction(selectedItems, (id) => productServices.restoreProduct(id));
    applyBulkOutcome(outcome, "đã khôi phục");
    setBulkBusy(false);
  };
  // Mở hộp thoại xác nhận trước khi xóa vĩnh viễn các mục đã chọn.
  const deleteSelected = () => {
    if (selectedItems.length) setBulkConfirming({ items: selectedItems, name: `${selectedItems.length} sản phẩm` });
  };

  useEffect(() => {
    let current = true;
    productServices.getProductTrash({ page: 1 }).then((response) => {
      if (!current) return;
      setData(response.data.data);
      setMeta(response.data.meta);
    }).catch((requestError) => {
      if (current) setError(requestError.response?.data?.message ?? "Không thể tải thùng rác sản phẩm.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, []);

  const columns = [
    { key: "name", label: "Sản phẩm", render: (item) => <span><span className="block font-semibold text-slate-900">{item.name}</span><span className="block text-xs text-slate-500">{item.slug}</span></span> },
    { key: "category", label: "Danh mục", render: (item) => item.category?.name ?? "—" },
    { key: "brand", label: "Thương hiệu", render: (item) => item.brand?.name ?? "—" },
    { key: "price", label: "Giá bán", render: (item) => <span><span className="block font-semibold text-slate-900">{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 2 }).format(Number(item.sale_price ?? item.price))}</span>{item.sale_price != null && <span className="block text-xs text-slate-400 line-through">{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 2 }).format(Number(item.price))}</span>}</span> },
    { key: "status", label: "Hiển thị trước khi xóa", render: (item) => <StatusBadge status={item.status} /> },
    { key: "deleted_at", label: "Ngày xóa", render: (item) => item.deleted_at ? new Date(item.deleted_at).toLocaleString("vi-VN") : "—" },
  ];

  return <section className="space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Khôi phục dữ liệu</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Thùng rác sản phẩm</h1><p className="mt-2 text-sm text-slate-600">Xem, khôi phục hoặc xóa vĩnh viễn sản phẩm trong thùng rác.</p></div><Link className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" href="/admin/product">Quay lại sản phẩm</Link></header>
    {notice && <p aria-live="polite" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status">{notice}</p>}
    <TrashTable
      bulkActions={<><button className="min-h-10 rounded-lg bg-indigo-700 px-4 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-50" disabled={bulkBusy} onClick={restoreSelected} type="button">Khôi phục mục đã chọn</button><button className="min-h-10 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700" onClick={deleteSelected} type="button">Xóa vĩnh viễn</button></>}
      columns={columns}
      data={data}
      error={error}
      loading={loading}
      meta={meta}
      onPageChange={handlePageChange}
      onRetry={() => load(meta?.current_page ?? 1)}
      onSelectionChange={setSelectedIds}
      renderActions={(item) => <div className="flex flex-wrap gap-2 whitespace-nowrap"><button aria-label={`Khôi phục sản phẩm ${item.name}`} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-indigo-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700" onClick={() => { setNotice(""); setRestoreConfirming(item); }} type="button">Khôi phục</button><button aria-label={`Xóa vĩnh viễn sản phẩm ${item.name}`} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600" onClick={() => setConfirming(item)} type="button">Xóa vĩnh viễn</button></div>}
      selectedIds={selectedIds}
    />
    <ConfirmDialog
      actionLabel="Khôi phục sản phẩm"
      eyebrow="Cần xác nhận"
      onComplete={(record) => {
        setNotice(`Đã khôi phục sản phẩm “${record.name}”.`);
        if (data.length <= 1 && (meta?.current_page ?? 1) > 1) {
          load(meta.current_page - 1);
          return;
        }
        setData((current) => current.filter((item) => item.id !== record.id));
        setMeta((current) => current ? { ...current, total: Math.max(0, (current.total ?? 1) - 1) } : current);
      }}
      onConfirm={(item) => productServices.restoreProduct(item.id)}
      onDismiss={() => setRestoreConfirming(null)}
      record={restoreConfirming}
      recordLabel={(record) => `${record.name} · ${record.slug}`}
      title="Khôi phục sản phẩm này?"
      variant="primary"
      renderDescription={() => <p className="text-sm leading-6 text-slate-600">Sản phẩm sẽ trở lại trang quản trị. Cần khôi phục danh mục và thương hiệu trước nếu chúng đang ở trong thùng rác.</p>}
    />
    <ConfirmDialog actionLabel="Xóa vĩnh viễn" description="Thao tác này không thể hoàn tác. Xóa sản phẩm" onComplete={(item) => { setSelectedIds([]); setNotice(`Đã xóa vĩnh viễn sản phẩm “${item.name}”.`); load(meta?.current_page ?? 1); }} onConfirm={(item) => productServices.forceDeleteProduct(item.id)} onDismiss={() => setConfirming(null)} record={confirming} requireAcknowledgement title="Xóa vĩnh viễn sản phẩm?" />
    <ConfirmDialog actionLabel="Xóa vĩnh viễn mục đã chọn" acknowledgementLabel="Tôi hiểu rằng không thể khôi phục các sản phẩm này sau khi xóa vĩnh viễn." onComplete={(_, outcome) => { applyBulkOutcome(outcome, "đã xóa vĩnh viễn"); setBulkConfirming(null); }} onConfirm={(payload) => runBulkTrashAction(payload.items, (id) => productServices.forceDeleteProduct(id))} onDismiss={() => setBulkConfirming(null)} record={bulkConfirming} recordLabel={(payload) => `${payload.items.length} sản phẩm đã chọn`} renderDescription={(payload) => <ul className="list-inside list-disc text-sm leading-6 text-slate-600">{payload.items.map((item) => <li key={item.id}>{item.name}</li>)}</ul>} requireAcknowledgement title="Xóa vĩnh viễn các sản phẩm đã chọn?" />
  </section>;
}
