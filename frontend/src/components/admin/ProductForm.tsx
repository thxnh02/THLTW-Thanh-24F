"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { AdminImageUpload } from "@/components/AdminImageUpload";
import { ApiError, apiGet, apiGetAllPages, apiPatch, apiPost } from "@/lib/api";
import { slugify } from "@/lib/slug";
import type { Brand, Category, Product, ProductImage, ProductVariant } from "@/types/api";

type VariantForm = {
  id?: number;
  sku: string;
  name: string;
  attributes: string;
  price: string;
  sale_price: string;
  stock_quantity: string;
  active: boolean;
  is_default: boolean;
};

type ImageForm = {
  id?: number;
  path: string;
  alt_text: string;
  is_primary: boolean;
  sort_order: string;
};

type Form = {
  name: string;
  slug: string;
  category_id: string;
  brand_id: string;
  short_description: string;
  description: string;
  status: "active" | "inactive" | "draft";
  featured: boolean;
  variants: VariantForm[];
  images: ImageForm[];
};

const newVariant = (): VariantForm => ({
  sku: "",
  name: "Mặc định",
  attributes: "",
  price: "",
  sale_price: "",
  stock_quantity: "0",
  active: true,
  is_default: true,
});

const blank: Form = {
  name: "",
  slug: "",
  category_id: "",
  brand_id: "",
  short_description: "",
  description: "",
  status: "active",
  featured: false,
  variants: [newVariant()],
  images: [],
};

export function ProductForm({ id }: { id?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<Form>(blank);
  const [slugEdited, setSlugEdited] = useState(Boolean(id));
  const [deletedVariantIds, setDeletedVariantIds] = useState<number[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(Boolean(id));
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;

    async function loadOptions() {
      try {
        const [categoryRows, brandRows] = await Promise.all([
          apiGetAllPages<Category>("/admin/categories"),
          apiGetAllPages<Brand>("/admin/brands"),
        ]);

        if (mounted) {
          setCategories(categoryRows);
          setBrands(brandRows);
          setOptionsError("");
        }
      } catch (reason) {
        if (mounted) {
          setOptionsError(toMessage(reason, "Không thể tải danh mục và thương hiệu."));
        }
      } finally {
        if (mounted) {
          setOptionsLoading(false);
        }
      }
    }

    void loadOptions();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function loadProduct() {
      try {
        const product = await apiGet<Product>(`/admin/products/${id}`);

        if (mounted) {
          setForm({
            name: product.name,
            slug: product.slug,
            category_id: String(product.category?.id ?? ""),
            brand_id: String(product.brand?.id ?? ""),
            short_description: product.short_description ?? "",
            description: product.description ?? "",
            status: product.status ?? "active",
            featured: Boolean(product.featured),
            variants: (product.variants ?? []).map(toVariantForm),
            images: (product.images ?? []).map(toImageForm),
          });
        }
      } catch (reason) {
        if (mounted) {
          setMessage(toMessage(reason, "Không thể tải sản phẩm."));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadProduct();

    return () => {
      mounted = false;
    };
  }, [id]);

  function updateName(name: string) {
    setForm((current) => ({
      ...current,
      name,
      slug: slugEdited ? current.slug : slugify(name),
    }));
  }

  function updateVariant(index: number, patch: Partial<VariantForm>) {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, itemIndex) =>
        itemIndex === index ? { ...variant, ...patch } : variant,
      ),
    }));
  }

  function addVariant() {
    setForm((current) => ({
      ...current,
      variants: [...current.variants, { ...newVariant(), is_default: false }],
    }));
  }

  function selectDefaultVariant(index: number) {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, itemIndex) => ({
        ...variant,
        is_default: itemIndex === index,
      })),
    }));
  }

  function removeVariant(index: number) {
    const variant = form.variants[index];

    if (!variant) {
      return;
    }

    if (form.variants.length === 1) {
      setErrors((current) => ({
        ...current,
        variants: "Sản phẩm phải có ít nhất một biến thể.",
      }));
      return;
    }

    if (variant.id) {
      setDeletedVariantIds((current) =>
        current.includes(variant.id as number) ? current : [...current, variant.id as number],
      );
    }

    setForm((current) => {
      const variants = current.variants.filter((_, itemIndex) => itemIndex !== index);

      if (!variants.some((item) => item.is_default)) {
        variants[0] = { ...variants[0], is_default: true };
      }

      return { ...current, variants };
    });
  }

  function updateImage(index: number, patch: Partial<ImageForm>) {
    setForm((current) => ({
      ...current,
      images: current.images.map((image, itemIndex) =>
        itemIndex === index ? { ...image, ...patch } : image,
      ),
    }));
  }

  function addImage(path: string) {
    setForm((current) => ({
      ...current,
      images: [
        ...current.images,
        {
          path,
          alt_text: current.name,
          is_primary: current.images.length === 0,
          sort_order: String(current.images.length + 1),
        },
      ],
    }));
  }

  function makePrimary(index: number) {
    setForm((current) => ({
      ...current,
      images: current.images.map((image, itemIndex) => ({
        ...image,
        is_primary: itemIndex === index,
      })),
    }));
  }

  function removeImage(index: number) {
    const image = form.images[index];

    if (!image) {
      return;
    }

    if (image.id) {
      setDeletedImageIds((current) =>
        current.includes(image.id as number) ? current : [...current, image.id as number],
      );
    }

    setForm((current) => {
      const images = current.images.filter((_, itemIndex) => itemIndex !== index);

      if (images.length > 0 && !images.some((item) => item.is_primary)) {
        images[0] = { ...images[0], is_primary: true };
      }

      return { ...current, images };
    });
  }

  function validate(): boolean {
    const nextErrors: Record<string, string> = {};
    const skuMap = new Map<string, number>();

    form.variants.forEach((variant, index) => {
      const sku = variant.sku.trim().toLowerCase();
      const price = Number(variant.price);
      const salePrice = variant.sale_price === "" ? null : Number(variant.sale_price);
      const stock = Number(variant.stock_quantity);

      if (!variant.sku.trim()) {
        nextErrors[`variants.${index}.sku`] = "SKU là bắt buộc.";
      }

      if (sku && skuMap.has(sku)) {
        nextErrors[`variants.${index}.sku`] = "SKU bị trùng trong sản phẩm.";
      }

      skuMap.set(sku, index);

      if (!Number.isFinite(price) || price < 0) {
        nextErrors[`variants.${index}.price`] = "Giá phải từ 0 trở lên.";
      }

      if (salePrice !== null && (!Number.isFinite(salePrice) || salePrice < 0 || salePrice > price)) {
        nextErrors[`variants.${index}.sale_price`] = "Giá khuyến mãi không hợp lệ.";
      }

      if (!Number.isInteger(stock) || stock < 0) {
        nextErrors[`variants.${index}.stock_quantity`] = "Tồn kho phải là số nguyên từ 0 trở lên.";
      }
    });

    if (form.variants.length === 0) {
      nextErrors.variants = "Sản phẩm phải có ít nhất một biến thể.";
    } else if (!form.variants.some((variant) => variant.is_default)) {
      nextErrors.variants = "Hãy chọn một biến thể mặc định.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const payload = {
        name: form.name,
        slug: form.slug || undefined,
        category_id: Number(form.category_id),
        brand_id: form.brand_id ? Number(form.brand_id) : undefined,
        short_description: form.short_description || undefined,
        description: form.description || undefined,
        status: form.status,
        featured: form.featured,
        deleted_variant_ids: deletedVariantIds,
        ...(id ? { deleted_image_ids: deletedImageIds } : {}),
        variants: form.variants.map((variant) => ({
          ...(id && variant.id ? { id: variant.id } : {}),
          sku: variant.sku,
          name: variant.name,
          attributes: parseAttributes(variant.attributes),
          price: Number(variant.price),
          sale_price: variant.sale_price ? Number(variant.sale_price) : undefined,
          stock_quantity: Number(variant.stock_quantity),
          active: variant.active,
          is_default: variant.is_default,
        })),
        images: form.images
          .filter((image) => image.path.trim())
          .map((image, index) => ({
            ...(id && image.id ? { id: image.id } : {}),
            path: image.path,
            alt_text: image.alt_text,
            is_primary: image.is_primary,
            sort_order: Number(image.sort_order || index + 1),
          })),
      };

      if (id) {
        await apiPatch(`/admin/products/${id}`, payload);
      } else {
        await apiPost("/admin/products", payload);
      }

      router.push("/admin/products");
    } catch (reason) {
      if (reason instanceof ApiError) {
        setErrors(
          Object.fromEntries(
            Object.entries(reason.errors).map(([key, messages]) => [key, messages[0] ?? reason.message]),
          ),
        );
        setMessage(reason.message);
      } else {
        setMessage(toMessage(reason, "Không thể lưu sản phẩm."));
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Đang tải...</p>;
  }

  return (
    <form onSubmit={submit} className="grid gap-5 rounded-md border border-slate-200 bg-white p-6 shadow-sm">
      <section className="grid gap-5 lg:grid-cols-2">
        <Field label="Tên sản phẩm" value={form.name} required onChange={updateName} />
        <Field
          label="Slug"
          value={form.slug}
          onChange={(slug) => {
            setSlugEdited(true);
            setForm((current) => ({ ...current, slug }));
          }}
        />
        <SelectField
          label="Danh mục"
          value={form.category_id}
          required
          disabled={optionsLoading}
          options={categories.map((category) => ({ value: String(category.id), label: category.name }))}
          onChange={(category_id) => setForm((current) => ({ ...current, category_id }))}
        />
        <SelectField
          label="Thương hiệu"
          value={form.brand_id}
          disabled={optionsLoading}
          options={[
            { value: "", label: "Không có" },
            ...brands.map((brand) => ({ value: String(brand.id), label: brand.name })),
          ]}
          onChange={(brand_id) => setForm((current) => ({ ...current, brand_id }))}
        />
        {optionsLoading ? <p className="text-xs font-normal text-slate-500">Đang tải danh mục và thương hiệu...</p> : null}
        {optionsError ? <p className="text-xs font-normal text-rose-700">{optionsError}</p> : null}
      </section>

      <section className="grid gap-4 border-t border-slate-200 pt-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-slate-950">Biến thể</h2>
            <p className="text-xs text-slate-500">Bao gồm đầy đủ SKU, giá và tồn kho của sản phẩm.</p>
          </div>
          <button type="button" onClick={addVariant} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">
            Thêm biến thể
          </button>
        </div>
        {errors.variants ? <p className="text-sm text-rose-700">{errors.variants}</p> : null}
        {errors.deleted_variant_ids ? <p className="text-sm text-rose-700">{errors.deleted_variant_ids}</p> : null}
        {form.variants.map((variant, index) => (
          <div key={variant.id ?? `new-${index}`} className="grid gap-3 rounded-md border border-slate-200 p-4 lg:grid-cols-4">
            <Field label="SKU" value={variant.sku} required error={errors[`variants.${index}.sku`]} onChange={(sku) => updateVariant(index, { sku })} />
            <Field label="Tên biến thể" value={variant.name} required onChange={(name) => updateVariant(index, { name })} />
            <Field label="Giá" type="number" value={variant.price} required error={errors[`variants.${index}.price`]} onChange={(price) => updateVariant(index, { price })} />
            <Field label="Giá khuyến mãi" type="number" value={variant.sale_price} error={errors[`variants.${index}.sale_price`]} onChange={(sale_price) => updateVariant(index, { sale_price })} />
            <Field label="Tồn kho" type="number" value={variant.stock_quantity} required error={errors[`variants.${index}.stock_quantity`]} onChange={(stock_quantity) => updateVariant(index, { stock_quantity })} />
            <Field label="Thuộc tính JSON" value={variant.attributes} placeholder='{"màu":"Đen"}' onChange={(attributes) => updateVariant(index, { attributes })} />
            <label className="flex items-center gap-2 pt-7 text-sm font-semibold">
              <input type="checkbox" checked={variant.active} onChange={(event) => updateVariant(index, { active: event.target.checked })} />
              Đang bán
            </label>
            <label className="flex items-center gap-2 pt-7 text-sm font-semibold">
              <input type="radio" name="default_variant" checked={variant.is_default} onChange={() => selectDefaultVariant(index)} />
              Mặc định
            </label>
            <button type="button" onClick={() => removeVariant(index)} className="text-left text-sm font-semibold text-rose-700">
              Xóa biến thể
            </button>
          </div>
        ))}
      </section>

      <section className="grid gap-4 border-t border-slate-200 pt-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-slate-950">Hình ảnh</h2>
            <p className="text-xs text-slate-500">Giữ ảnh cũ, thêm ảnh mới và chọn ảnh đại diện.</p>
          </div>
          <AdminImageUpload value="" directory="products" onChange={addImage} />
        </div>
        {errors.deleted_image_ids ? <p className="text-sm text-rose-700">{errors.deleted_image_ids}</p> : null}
        {form.images.map((image, index) => {
          const imageError = errors[`images.${index}.id`] ?? errors[`images.${index}.path`];

          return (
            <div key={image.id ?? `${image.path}-${index}`} className="grid gap-3 rounded-md border border-slate-200 p-3 sm:grid-cols-[100px_1fr_auto]">
              <div className="flex size-24 items-center justify-center overflow-hidden rounded-md bg-slate-100">
                {image.path ? <Image src={image.path} alt={image.alt_text || form.name} width={96} height={96} unoptimized className="size-full object-contain" /> : null}
              </div>
              <div className="grid gap-2">
                <input value={image.path} onChange={(event) => updateImage(index, { path: event.target.value })} className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
                <input value={image.alt_text} onChange={(event) => updateImage(index, { alt_text: event.target.value })} placeholder="Mô tả ảnh" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="primary_image" checked={image.is_primary} onChange={() => makePrimary(index)} />
                  Ảnh đại diện
                </label>
                {imageError ? <p className="text-xs text-rose-700">{imageError}</p> : null}
              </div>
              <button type="button" onClick={() => removeImage(index)} className="self-start text-sm font-semibold text-rose-700">
                Xóa
              </button>
            </div>
          );
        })}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <TextArea label="Mô tả ngắn" value={form.short_description} onChange={(short_description) => setForm((current) => ({ ...current, short_description }))} />
        <TextArea label="Mô tả đầy đủ" value={form.description} onChange={(description) => setForm((current) => ({ ...current, description }))} />
      </section>

      <section className="grid gap-5 sm:grid-cols-2">
        <SelectField
          label="Trạng thái"
          value={form.status}
          options={[
            { value: "active", label: "Đang bán" },
            { value: "inactive", label: "Đã tắt" },
            { value: "draft", label: "Bản nháp" },
          ]}
          onChange={(status) => setForm((current) => ({ ...current, status: status as Form["status"] }))}
        />
        <label className="flex items-center gap-2 pt-7 text-sm font-semibold">
          <input type="checkbox" checked={form.featured} onChange={(event) => setForm((current) => ({ ...current, featured: event.target.checked }))} />
          Nổi bật
        </label>
      </section>

      {message ? <p className="text-sm text-rose-700">{message}</p> : null}
      <div className="flex gap-2">
        <button disabled={saving} className="rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
          {saving ? "Đang lưu..." : "Lưu sản phẩm"}
        </button>
        <button type="button" onClick={() => router.push("/admin/products")} className="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold">
          Hủy
        </button>
      </div>
    </form>
  );
}

function toVariantForm(variant: ProductVariant): VariantForm {
  return {
    id: variant.id,
    sku: variant.sku,
    name: variant.name,
    attributes: variant.attributes ? JSON.stringify(variant.attributes) : "",
    price: String(variant.price),
    sale_price: variant.sale_price == null ? "" : String(variant.sale_price),
    stock_quantity: String(variant.stock_quantity),
    active: variant.active,
    is_default: variant.is_default,
  };
}

function toImageForm(image: ProductImage): ImageForm {
  return {
    id: image.id,
    path: image.path,
    alt_text: image.alt_text ?? "",
    is_primary: image.is_primary,
    sort_order: String(image.sort_order ?? image.id),
  };
}

function parseAttributes(value: string): Record<string, unknown> | undefined {
  if (!value.trim()) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : undefined;
  } catch {
    return undefined;
  }
}

function toMessage(reason: unknown, fallback: string): string {
  return reason instanceof Error ? reason.message : fallback;
}

function Field({ label, value, onChange, type = "text", required = false, error, placeholder }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
}) {
  return (
    <label className="text-sm font-semibold text-slate-700">
      {label}
      <input required={required} type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={`mt-1 h-10 w-full rounded-md border px-3 font-normal ${error ? "border-rose-500" : "border-slate-300"}`} />
      {error ? <span className="mt-1 block text-xs font-normal text-rose-700">{error}</span> : null}
    </label>
  );
}

function SelectField({ label, value, options, onChange, required = false, disabled = false }: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="text-sm font-semibold text-slate-700">
      {label}
      <select required={required} disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal disabled:bg-slate-100">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-sm font-semibold text-slate-700">
      {label}
      <textarea value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 font-normal" />
    </label>
  );
}
