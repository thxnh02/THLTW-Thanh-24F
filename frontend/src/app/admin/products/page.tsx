"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AdminImageUpload } from "@/components/AdminImageUpload";
import { useConfirm } from "@/contexts/ConfirmContext";
import { API_BASE_URL, ApiError, apiDelete, apiGetList, apiPatch, apiPost } from "@/lib/api";
import { formatVnd } from "@/lib/format";
import type { Brand, Category, Product } from "@/types/api";

type ProductForm = {
  id?: number;
  variant_id?: number;
  name: string;
  slug: string;
  category_id: string;
  brand_id: string;
  short_description: string;
  description: string;
  status: "active" | "inactive" | "draft";
  featured: boolean;
  sku: string;
  variant_name: string;
  price: string;
  sale_price: string;
  stock_quantity: string;
  images: string[];
};

const emptyForm: ProductForm = {
  name: "",
  slug: "",
  category_id: "",
  brand_id: "",
  short_description: "",
  description: "",
  status: "active",
  featured: false,
  sku: "",
  variant_name: "Default",
  price: "",
  sale_price: "",
  stock_quantity: "0",
  images: ["/product-placeholder.svg"],
};

export default function AdminProductsPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    Promise.all([
      apiGetList<Product>("/admin/products"),
      apiGetList<Category>("/admin/categories"),
      apiGetList<Brand>("/admin/brands"),
    ])
      .then(([productPayload, categoryPayload, brandPayload]) => {
        setProducts(productPayload);
        setCategories(categoryPayload);
        setBrands(brandPayload);
      })
      .catch((reason: Error) => {
        if (reason instanceof ApiError && reason.status === 401) {
          router.push("/admin/login");
          return;
        }
        setMessage(reason.message);
      });
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const payload = toPayload(form);

    if (form.id) {
      await apiPatch(`/admin/products/${form.id}`, payload);
    setMessage("Đã cập nhật sản phẩm.");
    } else {
      await apiPost("/admin/products", payload);
    setMessage("Đã tạo sản phẩm.");
    }

    setForm(emptyForm);
    load();
  }

  function edit(product: Product) {
    const variant = product.default_variant ?? product.variants?.[0];
    setForm({
      id: product.id,
      variant_id: variant?.id,
      name: product.name,
      slug: product.slug,
      category_id: String(product.category?.id ?? ""),
      brand_id: String(product.brand?.id ?? ""),
      short_description: product.short_description ?? "",
      description: product.description ?? "",
      status: product.status ?? "active",
      featured: false,
      sku: variant?.sku ?? "",
      variant_name: variant?.name ?? "Default",
      price: String(variant?.price ?? ""),
      sale_price: String(variant?.sale_price ?? ""),
      stock_quantity: String(variant?.stock_quantity ?? 0),
      images: product.images?.length ? product.images.map((image) => image.path) : [product.primary_image || "/product-placeholder.svg"],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(product: Product) {
    setMessage("");
    const accepted = await confirm({
      title: "Xóa sản phẩm?",
      message: `Bạn chắc chắn muốn xóa hoặc ẩn sản phẩm "${product.name}"?`,
      confirmLabel: "Xóa",
    });

    if (!accepted) {
      return;
    }

    await apiDelete(`/admin/products/${product.id}`);
    setMessage("Đã xóa hoặc ẩn sản phẩm.");
    load();
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-slate-950">Quản lý sản phẩm</h1>
        <Link href="/products" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">
          Xem shop
        </Link>
        <a href={`${API_BASE_URL}/admin/products/export`} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">
          Xuat CSV
        </a>
      </div>

      <form onSubmit={submit} className="grid gap-4 rounded-md border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-4">
        <Input label="Tên sản phẩm" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
        <Input label="Slug" value={form.slug} onChange={(value) => setForm({ ...form, slug: value })} />
        <label className="block text-sm font-semibold text-slate-700">
                Danh mục
          <select required value={form.category_id} onChange={(event) => setForm({ ...form, category_id: event.target.value })} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal">
            <option value="">Chọn danh mục</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold text-slate-700">
                Thương hiệu
          <select value={form.brand_id} onChange={(event) => setForm({ ...form, brand_id: event.target.value })} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal">
            <option value="">Không có</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </label>
        <Input label="SKU" value={form.sku} onChange={(value) => setForm({ ...form, sku: value })} required />
        <Input label="Ten variant" value={form.variant_name} onChange={(value) => setForm({ ...form, variant_name: value })} required />
        <Input label="Gia" type="number" value={form.price} onChange={(value) => setForm({ ...form, price: value })} required />
        <Input label="Giá khuyến mãi" type="number" value={form.sale_price} onChange={(value) => setForm({ ...form, sale_price: value })} />
        <Input label="Tồn kho" type="number" value={form.stock_quantity} onChange={(value) => setForm({ ...form, stock_quantity: value })} required />
        <label className="block text-sm font-semibold text-slate-700 lg:col-span-2">
          Ảnh sản phẩm
          <input value={form.images[0] ?? ""} onChange={(event) => setForm({ ...form, images: [event.target.value, ...form.images.slice(1)] })} required className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal outline-none focus:border-slate-950" />
          <div className="mt-2">
            <AdminImageUpload value={form.images[0] ?? ""} directory="products" onChange={(value) => setForm({ ...form, images: [value, ...form.images.filter((image) => image !== value)] })} />
          </div>
          <div className="mt-3 grid gap-2">
            {form.images.map((image, index) => (
              <div key={`${image}-${index}`} className="flex gap-2">
                <input value={image} onChange={(event) => setForm({ ...form, images: form.images.map((item, itemIndex) => itemIndex === index ? event.target.value : item) })} className="h-9 min-w-0 flex-1 rounded-md border border-slate-300 px-3 text-xs font-normal" />
                <button type="button" onClick={() => setForm({ ...form, images: form.images.filter((_, itemIndex) => itemIndex !== index) })} className="rounded-md border border-slate-300 px-3 text-xs font-semibold">
                  Xóa
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setForm({ ...form, images: [...form.images, ""] })} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold">
              Thêm ảnh
            </button>
          </div>
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Status
          <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ProductForm["status"] })} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal">
            <option value="active">Đang bán</option>
            <option value="inactive">Đã tắt</option>
            <option value="draft">Bản nháp</option>
          </select>
        </label>
        <label className="flex items-center gap-2 pt-7 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={form.featured} onChange={(event) => setForm({ ...form, featured: event.target.checked })} />
          Nổi bật
        </label>
        <label className="block text-sm font-semibold text-slate-700 lg:col-span-2">
          Mô tả ngắn
          <textarea value={form.short_description} onChange={(event) => setForm({ ...form, short_description: event.target.value })} className="mt-1 min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 font-normal" />
        </label>
        <label className="block text-sm font-semibold text-slate-700 lg:col-span-2">
          Mô tả đầy đủ
          <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1 min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 font-normal" />
        </label>
        <div className="flex gap-2 lg:col-span-4">
          <button className="rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
            {form.id ? "Cập nhật" : "Tạo sản phẩm"}
          </button>
          {form.id ? (
            <button type="button" onClick={() => setForm(emptyForm)} className="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold">
              Hủy sửa
            </button>
          ) : null}
        </div>
      </form>
      {message ? <p className="mt-3 text-sm text-teal-700">{message}</p> : null}

      <div className="mt-6 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="p-3">Sản phẩm</th><th className="p-3">Danh mục</th><th className="p-3">Giá</th><th className="p-3">Tồn kho</th><th className="p-3">Trạng thái</th><th className="p-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t border-slate-200">
                <td className="p-3 font-semibold">{product.name}</td>
                <td className="p-3">{product.category?.name}</td>
                <td className="p-3">{formatVnd(product.default_variant?.sale_price ?? product.default_variant?.price)}</td>
                <td className="p-3">{product.default_variant?.stock_quantity ?? 0}</td>
                <td className="p-3">{product.status === "inactive" ? "Đã tắt" : product.status === "draft" ? "Bản nháp" : "Đang bán"}</td>
                <td className="flex gap-2 p-3">
                  <button type="button" onClick={() => edit(product)} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">
                    Sua
                  </button>
                  <button type="button" onClick={() => remove(product)} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">
                    Xoa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal outline-none focus:border-slate-950"
      />
    </label>
  );
}

function toPayload(form: ProductForm) {
  return {
    name: form.name,
    slug: form.slug || undefined,
    category_id: Number(form.category_id),
    brand_id: form.brand_id ? Number(form.brand_id) : undefined,
    short_description: form.short_description || undefined,
    description: form.description || undefined,
    status: form.status,
    featured: form.featured,
    variants: [
      {
        sku: form.sku,
        id: form.variant_id,
        name: form.variant_name,
        price: Number(form.price),
        sale_price: form.sale_price ? Number(form.sale_price) : undefined,
        stock_quantity: Number(form.stock_quantity),
        active: true,
        is_default: true,
      },
    ],
    images: form.images.filter(Boolean).map((path, index) => ({
      path,
      alt_text: form.name,
      is_primary: index === 0,
      sort_order: index + 1,
    })),
  };
}
