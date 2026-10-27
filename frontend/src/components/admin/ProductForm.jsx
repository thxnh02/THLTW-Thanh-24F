"use client";

import Link from "next/link";
import { useState } from "react";
import AdminImageField from "@/components/admin/AdminImageField";
import AdminSlugField from "@/components/admin/AdminSlugField";
import { slugify } from "@/lib/slugify.mjs";

const blank = { name: "", slug: "", category_id: "", brand_id: "", price: "", sale_price: "", image: "", image_file: null, description: "", status: true, is_featured: false };

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

// Form nhập liệu dùng chung cho trang thêm và sửa; trang cha quyết định gọi API nào qua onSubmit.
export default function ProductForm({ initialData = blank, categories = [], brands = [], errors = {}, onSubmit, onError, submitting = false, cancelHref = "/admin/product" }) {
  const [form, setForm] = useState(() => ({ ...blank, ...initialData, category_id: initialData.category_id ?? "", brand_id: initialData.brand_id ?? "", price: initialData.price ?? "", sale_price: initialData.sale_price ?? "", is_featured: Boolean(initialData.is_featured) }));
  const [slugManual, setSlugManual] = useState(false);

  const message = (name) => errors[name]?.[0];
  const change = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value, ...(name === "name" && !slugManual ? { slug: slugify(value) } : {}) }));
    if (name === "slug") setSlugManual(Boolean(value.trim()));
  };
  const resetSlug = () => {
    setForm((current) => ({ ...current, slug: slugify(current.name) }));
    setSlugManual(false);
  };
  // Khi bấm Lưu: đổi giá/ID về kiểu số rồi chuyển dữ liệu cho save() ở trang thêm hoặc trang sửa.
  const submit = (event) => {
    event.preventDefault();
    onSubmit({ ...form, category_id: Number(form.category_id), brand_id: form.brand_id ? Number(form.brand_id) : null, price: Number(form.price), sale_price: form.sale_price === "" ? null : Number(form.sale_price), status: Boolean(form.status), is_featured: Boolean(form.is_featured) });
  };
  const fieldProps = (name) => ({ "aria-describedby": message(name) ? `${name}-error` : undefined, "aria-invalid": Boolean(message(name)) });
  const fieldError = (name) => message(name) && <small className="mt-1 block text-rose-700" id={`${name}-error`} role="alert">{message(name)}</small>;

  return (
    <form className="space-y-5" onSubmit={submit}>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,1fr)]">
        <div className="space-y-5">
      <section aria-labelledby="product-basic-heading" className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-950" id="product-basic-heading">Thông tin cơ bản</h2>
        <label className="admin-label">Tên sản phẩm<input {...fieldProps("name")} autoComplete="off" className="admin-input" maxLength={180} name="name" required value={form.name} onChange={change} />{fieldError("name")}</label>
        <AdminSlugField error={message("slug")} manual={slugManual} maxLength={200} value={form.slug} onChange={change} onReset={resetSlug} />
        <label className="admin-label">Mô tả<textarea {...fieldProps("description")} className="admin-input min-h-28 resize-y" name="description" value={form.description ?? ""} onChange={change} />{fieldError("description")}</label>
      </section>

      <section aria-labelledby="product-classification-heading" className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-950" id="product-classification-heading">Phân loại</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="admin-label">Danh mục<select {...fieldProps("category_id")} className="admin-input" name="category_id" required value={form.category_id} onChange={change}><option value="">Chọn danh mục</option>{categories.map((category) => <option key={category.id} value={category.id}>{"— ".repeat(categoryDepth(category, categories))}{category.name}</option>)}</select>{fieldError("category_id")}</label>
          <label className="admin-label">Thương hiệu <span className="font-normal text-slate-500">(không bắt buộc)</span><select {...fieldProps("brand_id")} className="admin-input" name="brand_id" value={form.brand_id} onChange={change}><option value="">Không có thương hiệu</option>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select>{fieldError("brand_id")}</label>
        </div>
      </section>

        </div>
        <div className="space-y-5">
      <section aria-labelledby="product-pricing-heading" className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-950" id="product-pricing-heading">Giá bán và hình ảnh</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="admin-label">Giá gốc<input {...fieldProps("price")} className="admin-input" inputMode="decimal" min="0" name="price" required step="0.01" type="number" value={form.price} onChange={change} />{fieldError("price")}</label>
          <label className="admin-label">Giá khuyến mãi <span className="font-normal text-slate-500">(không bắt buộc)</span><input {...fieldProps("sale_price")} className="admin-input" inputMode="decimal" min="0" name="sale_price" step="0.01" type="number" value={form.sale_price} onChange={change} />{fieldError("sale_price")}</label>
        </div>
        <p className="text-xs text-slate-500">Để trống nếu không giảm giá. Giá khuyến mãi phải thấp hơn giá gốc.</p>
        <AdminImageField errors={errors} file={form.image_file} fileName="image_file" label="Ảnh sản phẩm" name="image" value={form.image} onError={onError} onFileChange={(file) => setForm((current) => ({ ...current, image_file: file }))} onUrlChange={(image) => setForm((current) => ({ ...current, image }))} />
      </section>

      <section aria-labelledby="product-visibility-heading" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-950" id="product-visibility-heading">Hiển thị cửa hàng</h2>
        <label className="mt-4 flex min-h-11 items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm font-medium text-slate-700"><input {...fieldProps("status")} checked={form.status} className="h-4 w-4 accent-indigo-700" name="status" type="checkbox" onChange={change} /> Hiển thị sản phẩm trên cửa hàng</label>
        {fieldError("status")}
        <label className="mt-3 flex min-h-11 items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-950"><input {...fieldProps("is_featured")} checked={form.is_featured} className="h-4 w-4 accent-emerald-800" name="is_featured" type="checkbox" onChange={change} /> Chọn làm sản phẩm nổi bật trên trang chủ</label>
        {fieldError("is_featured")}
      </section>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:px-6">
        <Link className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" href={cancelHref}>Hủy</Link>
        <button className="min-h-11 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50" disabled={submitting || !categories.length} type="submit">{submitting ? "Đang lưu…" : initialData.id ? "Lưu sản phẩm" : "Thêm sản phẩm"}</button>
      </div>
    </form>
  );
}
