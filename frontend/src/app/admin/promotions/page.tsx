"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useConfirm } from "@/contexts/ConfirmContext";
import { ApiError, apiDelete, apiGetList, apiPatch, apiPost } from "@/lib/api";
import { formatVnd } from "@/lib/format";
import type { Brand, Category, Product, Promotion } from "@/types/api";

type PromotionForm = {
  id?: number;
  code: string;
  type: "fixed" | "percent";
  value: string;
  min_order_amount: string;
  max_discount_amount: string;
  start_at: string;
  end_at: string;
  active: boolean;
  usage_limit: string;
  usage_limit_per_user: string;
  applies_to: "all" | "products" | "categories" | "brands";
  first_order_only: boolean;
  free_shipping: boolean;
  min_quantity: string;
  product_ids: number[];
  category_ids: number[];
  brand_ids: number[];
};

const emptyForm: PromotionForm = {
  code: "",
  type: "percent",
  value: "",
  min_order_amount: "0",
  max_discount_amount: "",
  start_at: "",
  end_at: "",
  active: true,
  usage_limit: "",
  usage_limit_per_user: "1",
  applies_to: "all",
  first_order_only: false,
  free_shipping: false,
  min_quantity: "",
  product_ids: [],
  category_ids: [],
  brand_ids: [],
};

export default function AdminPromotionsPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [form, setForm] = useState<PromotionForm>(emptyForm);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    Promise.all([
      apiGetList<Promotion>("/admin/promotions"),
      apiGetList<Product>("/admin/products?per_page=100"),
      apiGetList<Category>("/admin/categories?per_page=100"),
      apiGetList<Brand>("/admin/brands?per_page=100"),
    ])
      .then(([promotionRows, productRows, categoryRows, brandRows]) => {
        setPromotions(promotionRows);
        setProducts(productRows);
        setCategories(categoryRows);
        setBrands(brandRows);
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
      await apiPatch(`/admin/promotions/${form.id}`, payload);
      setMessage("Đã cập nhật mã khuyến mãi.");
    } else {
      await apiPost("/admin/promotions", payload);
      setMessage("Đã tạo mã khuyến mãi.");
    }

    setForm(emptyForm);
    load();
  }

  function edit(promotion: Promotion) {
    setForm({
      id: promotion.id,
      code: promotion.code,
      type: promotion.type,
      value: String(promotion.value),
      min_order_amount: String(promotion.min_order_amount ?? 0),
      max_discount_amount: promotion.max_discount_amount ? String(promotion.max_discount_amount) : "",
      start_at: toDatetimeLocal(promotion.start_at),
      end_at: toDatetimeLocal(promotion.end_at),
      active: promotion.active,
      usage_limit: promotion.usage_limit ? String(promotion.usage_limit) : "",
      usage_limit_per_user: promotion.usage_limit_per_user ? String(promotion.usage_limit_per_user) : "",
      applies_to: promotion.applies_to ?? "all",
      first_order_only: Boolean(promotion.first_order_only),
      free_shipping: Boolean(promotion.free_shipping),
      min_quantity: promotion.min_quantity ? String(promotion.min_quantity) : "",
      product_ids: promotion.products?.map((product) => product.id) ?? [],
      category_ids: promotion.categories?.map((category) => category.id) ?? [],
      brand_ids: promotion.brands?.map((brand) => brand.id) ?? [],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(promotion: Promotion) {
    setMessage("");
    const accepted = await confirm({
      title: "Xóa mã khuyến mãi?",
      message: `Bạn chắc chắn muốn xóa mã "${promotion.code}"?`,
      confirmLabel: "Xóa",
    });

    if (!accepted) {
      return;
    }

    try {
      await apiDelete(`/admin/promotions/${promotion.id}`);
      setMessage("Đã xóa mã khuyến mãi.");
      load();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Không thể xóa mã khuyến mãi.");
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-950">Quản lý khuyến mãi</h1>

      <form onSubmit={submit} className="mt-6 grid gap-4 rounded-md border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-4">
        <Input label="Ma" value={form.code} onChange={(value) => setForm({ ...form, code: value.toUpperCase() })} required />
        <label className="block text-sm font-semibold text-slate-700">
          Kieu giam
          <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as PromotionForm["type"] })} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal">
            <option value="percent">Phần trăm</option>
            <option value="fixed">Số tiền</option>
          </select>
        </label>
        <Input label={form.type === "percent" ? "Giá trị (%)" : "Số tiền"} type="number" value={form.value} onChange={(value) => setForm({ ...form, value })} required />
        <Input label="Đơn tối thiểu" type="number" value={form.min_order_amount} onChange={(value) => setForm({ ...form, min_order_amount: value })} />
        <Input label="Giảm tối đa" type="number" value={form.max_discount_amount} onChange={(value) => setForm({ ...form, max_discount_amount: value })} />
        <Input label="Bắt đầu" type="datetime-local" value={form.start_at} onChange={(value) => setForm({ ...form, start_at: value })} />
        <Input label="Kết thúc" type="datetime-local" value={form.end_at} onChange={(value) => setForm({ ...form, end_at: value })} />
        <Input label="Tổng lượt" type="number" value={form.usage_limit} onChange={(value) => setForm({ ...form, usage_limit: value })} />
        <Input label="Lượt mỗi khách" type="number" value={form.usage_limit_per_user} onChange={(value) => setForm({ ...form, usage_limit_per_user: value })} />
        <label className="block text-sm font-semibold text-slate-700">
          Ap dung cho
          <select value={form.applies_to} onChange={(event) => setForm({ ...form, applies_to: event.target.value as PromotionForm["applies_to"] })} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal">
            <option value="all">Tất cả sản phẩm</option>
            <option value="products">Sản phẩm chọn</option>
            <option value="categories">Danh mục chọn</option>
            <option value="brands">Thương hiệu chọn</option>
          </select>
        </label>
        <Input label="Số lượng tối thiểu" type="number" value={form.min_quantity} onChange={(value) => setForm({ ...form, min_quantity: value })} />
        {form.applies_to === "products" ? <TargetSelect label="Sản phẩm" values={form.product_ids} options={products} onChange={(values) => setForm({ ...form, product_ids: values })} /> : null}
        {form.applies_to === "categories" ? <TargetSelect label="Danh mục" values={form.category_ids} options={categories} onChange={(values) => setForm({ ...form, category_ids: values })} /> : null}
        {form.applies_to === "brands" ? <TargetSelect label="Thương hiệu" values={form.brand_ids} options={brands} onChange={(values) => setForm({ ...form, brand_ids: values })} /> : null}
        <label className="flex items-center gap-2 pt-7 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={form.first_order_only} onChange={(event) => setForm({ ...form, first_order_only: event.target.checked })} />
          Chỉ đơn đầu tiên
        </label>
        <label className="flex items-center gap-2 pt-7 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={form.free_shipping} onChange={(event) => setForm({ ...form, free_shipping: event.target.checked })} />
          Miễn phí vận chuyển
        </label>
        <label className="flex items-center gap-2 pt-7 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
          Đang kích hoạt
        </label>
        <div className="flex gap-2 lg:col-span-4">
          <button className="rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
            {form.id ? "Cập nhật" : "Tạo mã"}
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
              <th className="p-3">Mã</th><th className="p-3">Giá trị</th><th className="p-3">Điều kiện</th><th className="p-3">Lượt dùng</th><th className="p-3">Trạng thái</th><th className="p-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {promotions.map((promotion) => (
              <tr key={promotion.id} className="border-t border-slate-200">
                <td className="p-3 font-semibold">{promotion.code}</td>
                <td className="p-3">{promotion.type === "percent" ? `${promotion.value}%` : formatVnd(promotion.value)}</td>
                <td className="p-3">
                  <span>Từ {formatVnd(promotion.min_order_amount)}</span>
                  {promotion.max_discount_amount ? <span className="block text-slate-500">Tối đa {formatVnd(promotion.max_discount_amount)}</span> : null}
                </td>
                <td className="p-3">
          {promotion.used_count}/{promotion.usage_limit ?? "không giới hạn"}
                </td>
                <td className="p-3">{promotion.active ? "Đang hoạt động" : "Đã tắt"}</td>
                <td className="flex gap-2 p-3">
                  <button type="button" onClick={() => edit(promotion)} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">
                    Sua
                  </button>
                  <button
                    type="button"
                    disabled={(promotion.usages_count ?? 0) > 0}
                    onClick={() => remove(promotion)}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  >
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

function toPayload(form: PromotionForm) {
  return {
    code: form.code,
    type: form.type,
    value: Number(form.value),
    min_order_amount: form.min_order_amount ? Number(form.min_order_amount) : 0,
    max_discount_amount: form.max_discount_amount ? Number(form.max_discount_amount) : undefined,
    start_at: form.start_at || undefined,
    end_at: form.end_at || undefined,
    active: form.active,
    usage_limit: form.usage_limit ? Number(form.usage_limit) : undefined,
    usage_limit_per_user: form.usage_limit_per_user ? Number(form.usage_limit_per_user) : undefined,
    applies_to: form.applies_to,
    first_order_only: form.first_order_only,
    free_shipping: form.free_shipping,
    min_quantity: form.min_quantity ? Number(form.min_quantity) : undefined,
    product_ids: form.product_ids,
    category_ids: form.category_ids,
    brand_ids: form.brand_ids,
  };
}

function TargetSelect({
  label,
  values,
  options,
  onChange,
}: {
  label: string;
  values: number[];
  options: { id: number; name: string }[];
  onChange: (values: number[]) => void;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <select
        multiple
        value={values.map(String)}
        onChange={(event) => onChange(Array.from(event.target.selectedOptions, (option) => Number(option.value)))}
        className="mt-1 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 font-normal"
      >
        {options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
      </select>
    </label>
  );
}

function toDatetimeLocal(value?: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 16);
}
