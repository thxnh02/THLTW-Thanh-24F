"use client";

import { useEffect, useState } from "react";
import axiosAdmin from "@/lib/axiosAdmin";

const empty = { code: "", type: "percent", value: "", minimum_vnd: "0", usage_limit: "", per_customer_limit: "", scope: "all", starts_at: "", ends_at: "", active: true };
const localDate = (value) => value ? new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "";

export default function CouponsPage() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [draft, setDraft] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const [productDraft, setProductDraft] = useState('');
  const [productQuery, setProductQuery] = useState('');
  const [productPage, setProductPage] = useState(1);
  const [productRows, setProductRows] = useState([]);
  const [productMeta, setProductMeta] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);

  useEffect(() => {
    let active = true;
    axiosAdmin.get('/admin/coupons', { params: { page } }).then(({ data }) => {
      if (active) { setRows(data.data); setMeta(data); }
    }).catch(() => { if (active) setError('Không thể tải danh sách mã giảm giá.'); });
    return () => { active = false; };
  }, [page, reload]);

  useEffect(() => {
    if (draft.scope !== 'specific') return undefined;
    let active = true;
    axiosAdmin.get('/admin/products', { params: { page: productPage, q: productQuery || undefined } }).then(({ data }) => {
      if (active) { setProductRows(data.data); setProductMeta(data.meta); }
    }).catch(() => { if (active) setError('Không thể tải sản phẩm để chọn.'); });
    return () => { active = false; };
  }, [draft.scope, productPage, productQuery]);

  const change = (key, value) => setDraft((old) => ({ ...old, [key]: value }));
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    const payload = { ...draft, value: Number(draft.value), minimum_vnd: Number(draft.minimum_vnd),
      usage_limit: draft.usage_limit ? Number(draft.usage_limit) : null,
      per_customer_limit: draft.per_customer_limit ? Number(draft.per_customer_limit) : null,
      product_ids: draft.scope === 'specific' ? selectedProducts.map((item) => item.id) : [],
      starts_at: draft.starts_at ? new Date(draft.starts_at).toISOString() : null,
      ends_at: draft.ends_at ? new Date(draft.ends_at).toISOString() : null };
    try {
      if (editing) await axiosAdmin.put(`/admin/coupons/${editing}`, payload);
      else await axiosAdmin.post('/admin/coupons', payload);
      setDraft(empty); setSelectedProducts([]); setEditing(null); setPage(1); setReload((n) => n + 1); setNotice('Đã lưu mã giảm giá.');
    } catch (err) {
      const fields = err.response?.data?.errors;
      setError(fields ? Object.values(fields).flat().join(' ') : 'Không thể lưu mã giảm giá.');
    } finally { setBusy(false); }
  };
  const startEdit = (row) => {
    setEditing(row.id); setError(''); setNotice('');
    setDraft({ ...row, starts_at: localDate(row.starts_at), ends_at: localDate(row.ends_at), usage_limit: row.usage_limit ?? '', per_customer_limit: row.per_customer_limit ?? '', scope: row.scope ?? 'all' });
    setSelectedProducts(row.products ?? []);
  };
  const remove = async (row) => {
    if (!window.confirm(`Xóa mã ${row.code}? Các đơn đã đặt vẫn giữ thông tin giảm giá.`)) return;
    try { await axiosAdmin.delete(`/admin/coupons/${row.id}`); setReload((n) => n + 1); setNotice('Đã xóa mã giảm giá.'); }
    catch { setError('Không thể xóa mã giảm giá.'); }
  };

  return <section className="space-y-5"><header><h1 className="text-3xl font-semibold">Mã giảm giá</h1><p className="mt-2 text-sm text-slate-600">Tạo mã giảm theo phần trăm hoặc số tiền, giới hạn thời gian và lượt sử dụng.</p></header>
    {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-rose-800">{error}</p>}{notice && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-emerald-800">{notice}</p>}
    <form onSubmit={submit} className="grid gap-4 rounded-xl border bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
      <label className="text-sm">Mã<input className="admin-input mt-1" required maxLength={40} pattern="[A-Za-z0-9_-]+" value={draft.code} onChange={(e) => change('code', e.target.value.toUpperCase())} /></label>
      <label className="text-sm">Hình thức<select className="admin-input mt-1" value={draft.type} onChange={(e) => change('type', e.target.value)}><option value="percent">Phần trăm</option><option value="fixed">Số tiền (đ)</option></select></label>
      <label className="text-sm">Mức giảm<input className="admin-input mt-1" type="number" min="1" max={draft.type === 'percent' ? 100 : 900000000000} required value={draft.value} onChange={(e) => change('value', e.target.value)} /></label>
      <label className="text-sm">Đơn tối thiểu (đ)<input className="admin-input mt-1" type="number" min="0" max="900000000000" required value={draft.minimum_vnd} onChange={(e) => change('minimum_vnd', e.target.value)} /></label>
      <label className="text-sm">Số lượt tối đa<input className="admin-input mt-1" type="number" min="1" max="1000000000" value={draft.usage_limit} onChange={(e) => change('usage_limit', e.target.value)} placeholder="Không giới hạn" /></label>
      <label className="text-sm">Số lượt mỗi khách<input className="admin-input mt-1" type="number" min="1" max="1000000000" value={draft.per_customer_limit} onChange={(e) => change('per_customer_limit', e.target.value)} placeholder="Không giới hạn" /></label>
      <p className="self-end text-xs text-slate-500">Lượt dùng được tính khi đặt đơn, bao gồm đơn đã hủy.</p>
      <label className="text-sm">Áp dụng cho<select className="admin-input mt-1" value={draft.scope} onChange={(e) => change('scope', e.target.value)}><option value="all">Tất cả sản phẩm</option><option value="specific">Sản phẩm được chọn</option></select></label>
      <label className="text-sm">Bắt đầu<input className="admin-input mt-1" type="datetime-local" value={draft.starts_at} onChange={(e) => change('starts_at', e.target.value)} /></label>
      <label className="text-sm">Kết thúc<input className="admin-input mt-1" type="datetime-local" value={draft.ends_at} onChange={(e) => change('ends_at', e.target.value)} /></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.active} onChange={(e) => change('active', e.target.checked)} /> Đang hoạt động</label>
      {draft.scope === 'specific' && <div className="space-y-3 rounded-lg border p-4 sm:col-span-2 lg:col-span-4"><p className="text-sm font-semibold">Chọn sản phẩm được giảm giá</p><div className="flex gap-2"><input aria-label="Tìm sản phẩm" className="admin-input" maxLength={100} value={productDraft} onChange={(e) => setProductDraft(e.target.value)} /><button className="rounded-lg border px-3 text-sm" type="button" onClick={() => { setProductPage(1); setProductQuery(productDraft.trim()); }}>Tìm</button></div><div className="grid gap-2 sm:grid-cols-2">{productRows.map((product) => <label key={product.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selectedProducts.some((item) => item.id === product.id)} onChange={(e) => setSelectedProducts((old) => e.target.checked ? [...old, { id: product.id, name: product.name }] : old.filter((item) => item.id !== product.id))} />{product.name}</label>)}</div><div className="flex gap-3 text-sm"><button type="button" disabled={productPage <= 1} onClick={() => setProductPage(productPage - 1)}>Trước</button><span>Trang {productPage} / {productMeta?.last_page ?? 1}</span><button type="button" disabled={productPage >= (productMeta?.last_page ?? 1)} onClick={() => setProductPage(productPage + 1)}>Sau</button></div><p className="text-sm text-slate-600">Đã chọn: {selectedProducts.length ? selectedProducts.map((item) => item.name).join(', ') : 'chưa chọn sản phẩm'}. Giảm giá chỉ tính trên sản phẩm đã chọn; đơn tối thiểu tính trên cả đơn.</p></div>}
      <div className="flex gap-3 sm:col-span-2 lg:col-span-4"><button className="rounded-lg bg-indigo-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50" disabled={busy}>{editing ? 'Lưu thay đổi' : 'Tạo mã giảm giá'}</button>{editing && <button type="button" className="px-4 text-sm underline" onClick={() => { setEditing(null); setDraft(empty); setSelectedProducts([]); }}>Hủy sửa</button>}</div>
    </form>
    <div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-50"><tr>{['Mã', 'Giảm', 'Đơn tối thiểu', 'Đã dùng', 'Trạng thái', 'Thao tác'].map((x) => <th className="p-3" key={x}>{x}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-t" key={row.id}><td className="p-3 font-semibold">{row.code}</td><td className="p-3">{row.type === 'percent' ? `${row.value}%` : `${Number(row.value).toLocaleString('vi-VN')} đ`}</td><td className="p-3">{Number(row.minimum_vnd).toLocaleString('vi-VN')} đ</td><td className="p-3">{row.used_count}{row.usage_limit ? ` / ${row.usage_limit}` : ''}</td><td className="p-3">{row.active ? 'Hoạt động' : 'Đã tắt'}</td><td className="p-3"><button className="mr-3 text-indigo-700 underline" type="button" onClick={() => startEdit(row)}>Sửa</button><button className="text-rose-700 underline" type="button" onClick={() => remove(row)}>Xóa</button></td></tr>)}</tbody></table>{!rows.length && <p className="p-4 text-sm text-slate-500">Chưa có mã giảm giá.</p>}</div>
    <div className="flex gap-3 text-sm"><button disabled={page <= 1} onClick={() => setPage(page - 1)}>Trang trước</button><span>Trang {page} / {meta?.last_page ?? 1}</span><button disabled={page >= (meta?.last_page ?? 1)} onClick={() => setPage(page + 1)}>Trang sau</button></div>
  </section>;
}
