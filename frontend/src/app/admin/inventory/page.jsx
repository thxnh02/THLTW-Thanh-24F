"use client";

import { useEffect, useState } from "react";
import axiosAdmin from "@/lib/axiosAdmin";

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [productPage, setProductPage] = useState(1);
  const [productMeta, setProductMeta] = useState(null);
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('');
  const [change, setChange] = useState('');
  const [reason, setReason] = useState('');
  const [moves, setMoves] = useState([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    axiosAdmin.get('/admin/products', { params: { page: productPage, q: query || undefined } }).then(({ data }) => {
      if (active) { setProducts(data.data); setProductMeta(data.meta); }
    }).catch(() => { if (active) setError('Không thể tải sản phẩm.'); });
    return () => { active = false; };
  }, [productPage, query, reload]);
  useEffect(() => {
    let active = true;
    axiosAdmin.get('/admin/inventory/movements', { params: { page } }).then(({ data }) => { if (active) { setMoves(data.data); setMeta(data); } })
      .catch(() => { if (active) setError('Không thể tải lịch sử tồn kho.'); });
    return () => { active = false; };
  }, [page, reload]);
  const submit = async (event) => {
    event.preventDefault(); if (!selected || busy) return;
    setError(''); setNotice(''); setBusy(true);
    try {
      await axiosAdmin.post(`/admin/inventory/products/${selected}/adjust`, { change: Number(change), reason });
      setChange(''); setReason(''); setPage(1); setReload((n) => n + 1); setNotice('Đã cập nhật tồn kho.');
    } catch (err) { const fields = err.response?.data?.errors; setError(fields ? Object.values(fields).flat().join(' ') : 'Không thể cập nhật tồn kho.'); }
    finally { setBusy(false); }
  };
  return <section className="space-y-5"><header><h1 className="text-3xl font-semibold">Tồn kho</h1><p className="mt-2 text-sm text-slate-600">Nhập số dương để tăng, số âm để giảm. Lịch sử bắt đầu từ khi chức năng được bật.</p></header>
    {error && <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800" role="alert">{error}</p>}{notice && <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800" role="status">{notice}</p>}
    <div className="rounded-xl border bg-white p-5"><form className="flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); setProductPage(1); setSelected(''); setQuery(draft.trim()); }}><label className="text-sm">Tìm sản phẩm<input className="admin-input mt-1 block" maxLength={100} value={draft} onChange={(e) => setDraft(e.target.value)} /></label><button className="min-h-11 rounded-lg bg-slate-800 px-4 text-sm text-white">Tìm</button></form>
      <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={submit}><label className="text-sm">Sản phẩm<select className="admin-input mt-1 block" required value={selected} onChange={(e) => setSelected(e.target.value)}><option value="">Chọn sản phẩm</option>{products.map((item) => <option key={item.id} value={item.id}>{item.name} · Tồn: {item.stock_quantity ?? 'Không theo dõi'}</option>)}</select></label><label className="text-sm">Điều chỉnh<input className="admin-input mt-1 block" type="number" min="-1000000" max="1000000" required value={change} onChange={(e) => setChange(e.target.value)} /></label><label className="text-sm">Lý do<input className="admin-input mt-1 block" minLength={3} maxLength={180} required value={reason} onChange={(e) => setReason(e.target.value)} /></label><button className="min-h-11 rounded-lg bg-indigo-700 px-4 text-sm font-semibold text-white disabled:opacity-50" disabled={busy}>{busy ? 'Đang lưu…' : 'Cập nhật'}</button></form>
      <div className="mt-3 flex gap-3 text-sm"><button disabled={productPage <= 1} onClick={() => { setSelected(''); setProductPage(productPage - 1); }}>Trước</button><span>Sản phẩm {productPage} / {productMeta?.last_page ?? 1}</span><button disabled={productPage >= (productMeta?.last_page ?? 1)} onClick={() => { setSelected(''); setProductPage(productPage + 1); }}>Sau</button></div></div>
    <div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full text-left text-sm"><thead><tr>{['Thời gian', 'Sản phẩm', 'Trước', 'Sau', 'Lý do'].map((value) => <th key={value} className="p-3">{value}</th>)}</tr></thead><tbody>{moves.map((move) => <tr className="border-t" key={move.id}><td className="p-3">{new Date(move.created_at).toLocaleString('vi-VN')}</td><td className="p-3">{move.product_name}</td><td className="p-3">{move.before_quantity ?? 'Không theo dõi'}</td><td className="p-3">{move.after_quantity ?? 'Không theo dõi'}</td><td className="p-3">{move.reason}</td></tr>)}</tbody></table>{!moves.length && <p className="p-4 text-sm text-slate-500">Chưa có biến động tồn kho.</p>}</div>
    <div className="flex gap-3 text-sm"><button disabled={page <= 1} onClick={() => setPage(page - 1)}>Trang trước</button><span>Trang {page} / {meta?.last_page ?? 1}</span><button disabled={page >= (meta?.last_page ?? 1)} onClick={() => setPage(page + 1)}>Trang sau</button></div>
  </section>;
}
