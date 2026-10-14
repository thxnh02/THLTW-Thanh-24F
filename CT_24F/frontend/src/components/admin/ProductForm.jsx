"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const blank = { name: "", slug: "", category_id: "", brand_id: "", price: "", image: "", description: "", status: true };

function slugify(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function categoryDepth(category, categories) {
  const byId = new Map(categories.map((item) => [Number(item.id), item]));
  const seen = new Set();
  let parentId = category.parent_id;
  let depth = 0;
  while (parentId && !seen.has(Number(parentId))) {
    seen.add(Number(parentId));
    const parent = byId.get(Number(parentId));
    if (!parent) break;
    depth += 1;
    parentId = parent.parent_id;
  }
  return depth;
}

export default function ProductForm({ initialData = blank, categories = [], brands = [], errors = {}, onSubmit, submitting = false, cancelHref = "/admin/product" }) {
  const [form, setForm] = useState(() => ({ ...blank, ...initialData, category_id: initialData.category_id ?? "", brand_id: initialData.brand_id ?? "", price: initialData.price ?? "" }));
  const [slugTouched, setSlugTouched] = useState(Boolean(initialData.slug));
  const [previewFailed, setPreviewFailed] = useState(false);

  const message = (name) => errors[name]?.[0];
  const change = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value, ...(name === "name" && !slugTouched ? { slug: slugify(value) } : {}) }));
    if (name === "slug") setSlugTouched(true);
    if (name === "image") setPreviewFailed(false);
  };
  const submit = (event) => {
    event.preventDefault();
    onSubmit({ ...form, category_id: Number(form.category_id), brand_id: form.brand_id ? Number(form.brand_id) : null, price: Number(form.price), status: Boolean(form.status) });
  };
  const fieldProps = (name) => ({ "aria-describedby": message(name) ? `${name}-error` : undefined, "aria-invalid": Boolean(message(name)) });
  const fieldError = (name) => message(name) && <small className="mt-1 block text-rose-700" id={`${name}-error`} role="alert">{message(name)}</small>;
  const previewSource = /^(https?:\/\/|\/)/i.test(form.image.trim()) ? form.image.trim() : "";

  return (
    <form className="space-y-5" onSubmit={submit}>
      <section aria-labelledby="product-basic-heading" className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-950" id="product-basic-heading">Thông tin cơ bản</h2>
        <label className="admin-label">Tên sản phẩm<input {...fieldProps("name")} autoComplete="off" className="admin-input" maxLength={180} name="name" required value={form.name} onChange={change} />{fieldError("name")}</label>
        <label className="admin-label">Đường dẫn<input {...fieldProps("slug")} className="admin-input" maxLength={200} name="slug" required value={form.slug} onChange={change} />{fieldError("slug")}</label>
        <label className="admin-label">Mô tả<textarea {...fieldProps("description")} className="admin-input min-h-28 resize-y" name="description" value={form.description ?? ""} onChange={change} />{fieldError("description")}</label>
      </section>

      <section aria-labelledby="product-classification-heading" className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-950" id="product-classification-heading">Phân loại</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="admin-label">Danh mục<select {...fieldProps("category_id")} className="admin-input" name="category_id" required value={form.category_id} onChange={change}><option value="">Chọn danh mục</option>{categories.map((category) => <option key={category.id} value={category.id}>{"— ".repeat(categoryDepth(category, categories))}{category.name}</option>)}</select>{fieldError("category_id")}</label>
          <label className="admin-label">Thương hiệu <span className="font-normal text-slate-500">(không bắt buộc)</span><select {...fieldProps("brand_id")} className="admin-input" name="brand_id" value={form.brand_id} onChange={change}><option value="">Không có thương hiệu</option>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select>{fieldError("brand_id")}</label>
        </div>
      </section>

      <section aria-labelledby="product-pricing-heading" className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-950" id="product-pricing-heading">Giá bán và hình ảnh</h2>
        <label className="admin-label">Giá sản phẩm<input {...fieldProps("price")} className="admin-input max-w-sm" inputMode="decimal" min="0" name="price" required step="0.01" type="number" value={form.price} onChange={change} />{fieldError("price")}</label>
        <label className="admin-label">Đường dẫn hình ảnh<input {...fieldProps("image")} className="admin-input" maxLength={255} name="image" value={form.image ?? ""} onChange={change} />{fieldError("image")}</label>
        <div aria-live="polite" className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          {previewSource && !previewFailed ? <Image alt={`${form.name || "Sản phẩm"} preview`} className="h-20 w-20 rounded-lg object-cover" height={80} loading="lazy" src={previewSource} unoptimized width={80} onError={() => setPreviewFailed(true)} /> : <div aria-label="Chưa có hình ảnh" className="grid h-20 w-20 place-items-center rounded-lg bg-slate-200 text-xs font-semibold text-slate-500" role="img">Chưa có ảnh</div>}
          <p className="text-sm font-semibold text-slate-800">Xem trước hình ảnh</p>
        </div>
      </section>

      <section aria-labelledby="product-visibility-heading" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-950" id="product-visibility-heading">Hiển thị cửa hàng</h2>
        <label className="mt-4 flex min-h-11 items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm font-medium text-slate-700"><input {...fieldProps("status")} checked={form.status} className="h-4 w-4 accent-indigo-700" name="status" type="checkbox" onChange={change} /> Hiển thị sản phẩm trên cửa hàng</label>
        {fieldError("status")}
      </section>

      <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-5">
        <Link className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" href={cancelHref}>Hủy</Link>
        <button className="min-h-11 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50" disabled={submitting || !categories.length} type="submit">{submitting ? "Đang lưu…" : initialData.id ? "Lưu sản phẩm" : "Thêm sản phẩm"}</button>
      </div>
    </form>
  );
}
