"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import categoryServices from "@/services/categoryServices";
import brandServices from "@/services/brandServices";
import productServices from "@/services/productServices";

const emptyForm = { name: "", slug: "", category_id: "", brand_id: "", price: "", image: "", description: "", status: true };
const slugify = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const flattenCategories = (items, depth = 0) => items.flatMap((item) => [{ ...item, depth }, ...flattenCategories(item.children ?? [], depth + 1)]);

export default function CreateProductPage() {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [errors, setErrors] = useState({});
  const [requestError, setRequestError] = useState("");
  const [success, setSuccess] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([categoryServices.getCategories(), brandServices.getBrands()]).then(([categoryResponse, brandResponse]) => {
      setCategories(flattenCategories(categoryResponse.data.data ?? [])); setBrands(brandResponse.data.data ?? []);
    }).catch(() => setRequestError("Không tải được danh mục hoặc thương hiệu. Hãy kiểm tra kết nối API."))
      .finally(() => setLoadingOptions(false));
  }, []);

  const change = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value, ...(name === "name" && !slugEdited ? { slug: slugify(value) } : {}) }));
    if (name === "slug") setSlugEdited(true);
    setErrors((current) => ({ ...current, [name]: undefined })); setSuccess("");
  };

  const save = async (event) => {
    event.preventDefault(); setSubmitting(true); setErrors({}); setRequestError(""); setSuccess("");
    try {
      const { data } = await productServices.createProduct({ ...form, category_id: Number(form.category_id), brand_id: form.brand_id ? Number(form.brand_id) : null, price: Number(form.price), status: Boolean(form.status) });
      setSuccess(`Đã tạo sản phẩm “${data.data?.name ?? form.name}”. Sản phẩm đã được lưu vào cửa hàng.`); setForm(emptyForm); setSlugEdited(false);
    } catch (error) {
      setErrors(error.response?.data?.errors ?? {}); setRequestError(error.response?.data?.message ?? "Chưa thể tạo sản phẩm. Vui lòng kiểm tra lại thông tin.");
    } finally { setSubmitting(false); }
  };
  const fieldError = (key) => errors[key]?.[0];

  return <section className="mx-auto max-w-4xl">
    <div className="mb-6"><Link className="text-xs font-semibold text-[#54776d] hover:underline" href="/admin">← Tổng quan</Link><p className="eyebrow mt-5">Bộ sưu tập CT_24F</p><h1 className="section-title">Thêm sản phẩm</h1><p className="mt-2 text-sm text-slate-500">Nhập thông tin sản phẩm mới để hiển thị trong cửa hàng.</p></div>
    <div className="overflow-hidden rounded-[1.5rem] border border-[#e7ece8] bg-white shadow-sm">
      <div className="grid md:grid-cols-[.85fr_1.4fr]">
        <aside className="bg-[#193b34] p-6 text-white sm:p-8"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#d1edda] text-xl text-[#193b34]">✳</span><h2 className="mt-6 text-xl font-semibold">Thông tin sản phẩm</h2><p className="mt-2 text-sm leading-6 text-white/65">Tên rõ ràng, giá chính xác và danh mục phù hợp giúp khách hàng tìm được điều họ cần.</p><div className="mt-8 space-y-4 text-xs text-white/70"><p><span className="mr-2 text-[#b8e0c7]">01</span> Thông tin cơ bản</p><p><span className="mr-2 text-[#b8e0c7]">02</span> Phân loại & giá</p><p><span className="mr-2 text-[#b8e0c7]">03</span> Hiển thị cửa hàng</p></div></aside>
        <form className="space-y-5 p-6 sm:p-8" onSubmit={save}>
          {success && <p aria-live="polite" className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800">{success}</p>}
          {requestError && <p aria-live="polite" className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{requestError}</p>}
          <label className="admin-label">Tên sản phẩm<input autoComplete="off" className="admin-input" maxLength={180} name="name" onChange={change} placeholder="Ví dụ: Tai nghe không dây" required value={form.name} />{fieldError("name") && <small className="mt-1 block text-red-600">{fieldError("name")}</small>}</label>
          <label className="admin-label">Slug<input className="admin-input" maxLength={200} name="slug" onChange={change} placeholder="tai-nghe-khong-day" required value={form.slug} />{fieldError("slug") && <small className="mt-1 block text-red-600">{fieldError("slug")}</small>}</label>
          <div className="grid gap-4 sm:grid-cols-2"><label className="admin-label">Danh mục<select className="admin-input" disabled={loadingOptions} name="category_id" onChange={change} required value={form.category_id}><option value="">{loadingOptions ? "Đang tải..." : "Chọn danh mục"}</option>{categories.map((category) => <option key={category.id} value={category.id}>{"— ".repeat(category.depth)}{category.name}</option>)}</select>{fieldError("category_id") && <small className="mt-1 block text-red-600">{fieldError("category_id")}</small>}</label>
            <label className="admin-label">Thương hiệu<select className="admin-input" disabled={loadingOptions} name="brand_id" onChange={change} value={form.brand_id}><option value="">Không chọn</option>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select>{fieldError("brand_id") && <small className="mt-1 block text-red-600">{fieldError("brand_id")}</small>}</label></div>
          <div className="grid gap-4 sm:grid-cols-2"><label className="admin-label">Giá bán (VNĐ)<input className="admin-input" min="0" name="price" onChange={change} placeholder="0" required step="1000" type="number" value={form.price} />{fieldError("price") && <small className="mt-1 block text-red-600">{fieldError("price")}</small>}</label>
            <label className="admin-label">Đường dẫn hình ảnh<input className="admin-input" maxLength={255} name="image" onChange={change} placeholder="https://... (không bắt buộc)" value={form.image} />{fieldError("image") && <small className="mt-1 block text-red-600">{fieldError("image")}</small>}</label></div>
          <label className="admin-label">Mô tả<textarea className="admin-input min-h-24 resize-y" name="description" onChange={change} placeholder="Mô tả ngắn về sản phẩm..." value={form.description} />{fieldError("description") && <small className="mt-1 block text-red-600">{fieldError("description")}</small>}</label>
          <label className="flex items-center gap-3 rounded-xl bg-[#f6f8f6] p-4 text-sm font-medium text-slate-700"><input checked={form.status} className="h-4 w-4 accent-[#37665b]" name="status" onChange={change} type="checkbox" /><span>Hiển thị sản phẩm trong cửa hàng</span></label>
          <div className="flex flex-wrap gap-3 border-t border-[#eef1ee] pt-5"><button className="rounded-full bg-[#193b34] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#28564d] disabled:opacity-50" disabled={submitting || loadingOptions || !categories.length} type="submit">{submitting ? "Đang lưu..." : "Tạo sản phẩm"}</button><button className="rounded-full border border-[#dfe7e1] px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50" onClick={() => router.push("/admin")} type="button">Quay lại</button></div>
        </form>
      </div>
    </div>
  </section>;
}
