"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, ChevronUp, FileText, Image as ImageIcon, LoaderCircle, Package, Plus, Save, Settings2, Star, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { AdminImageUpload } from "@/components/admin/media/AdminImageUpload";
import { Badge, Button, Input, SectionCard, Select, Textarea } from "@/components/ui";
import { ApiError, apiGet, apiGetAllPages, apiPatch, apiPost } from "@/lib/api";
import { formatVnd } from "@/lib/format";
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

const newVariant = (): VariantForm => ({ sku: "", name: "Mặc định", attributes: "", price: "", sale_price: "", stock_quantity: "0", active: true, is_default: true });
const blank: Form = { name: "", slug: "", category_id: "", brand_id: "", short_description: "", description: "", status: "active", featured: false, variants: [newVariant()], images: [] };

export function ProductForm({ id }: { id?: string }) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
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
  const [expandedAttributes, setExpandedAttributes] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let mounted = true;
    async function loadOptions() {
      try {
        const [categoryRows, brandRows] = await Promise.all([apiGetAllPages<Category>("/admin/categories"), apiGetAllPages<Brand>("/admin/brands")]);
        if (mounted) { setCategories(categoryRows); setBrands(brandRows); setOptionsError(""); }
      } catch (reason) {
        if (mounted) setOptionsError(toMessage(reason, "Không thể tải danh mục và thương hiệu."));
      } finally {
        if (mounted) setOptionsLoading(false);
      }
    }
    void loadOptions();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    let mounted = true;
    async function loadProduct() {
      try {
        const product = await apiGet<Product>(`/admin/products/${id}`);
        if (mounted) setForm({ name: product.name, slug: product.slug, category_id: String(product.category?.id ?? ""), brand_id: String(product.brand?.id ?? ""), short_description: product.short_description ?? "", description: product.description ?? "", status: product.status ?? "active", featured: Boolean(product.featured), variants: (product.variants ?? []).map(toVariantForm), images: (product.images ?? []).map(toImageForm) });
      } catch (reason) {
        if (mounted) setMessage(toMessage(reason, "Không thể tải sản phẩm."));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void loadProduct();
    return () => { mounted = false; };
  }, [id]);

  function updateName(name: string) { setForm((current) => ({ ...current, name, slug: slugEdited ? current.slug : slugify(name) })); }
  function updateVariant(index: number, patch: Partial<VariantForm>) { setForm((current) => ({ ...current, variants: current.variants.map((variant, itemIndex) => itemIndex === index ? { ...variant, ...patch } : variant) })); }
  function addVariant() { setForm((current) => ({ ...current, variants: [...current.variants, { ...newVariant(), is_default: false }] })); }
  function selectDefaultVariant(index: number) { setForm((current) => ({ ...current, variants: current.variants.map((variant, itemIndex) => ({ ...variant, is_default: itemIndex === index })) })); }

  function removeVariant(index: number) {
    const variant = form.variants[index];
    if (!variant) return;
    if (form.variants.length === 1) { setErrors((current) => ({ ...current, variants: "Sản phẩm phải có ít nhất một biến thể." })); return; }
    if (variant.id) setDeletedVariantIds((current) => current.includes(variant.id as number) ? current : [...current, variant.id as number]);
    setForm((current) => {
      const variants = current.variants.filter((_, itemIndex) => itemIndex !== index);
      if (!variants.some((item) => item.is_default)) variants[0] = { ...variants[0], is_default: true };
      return { ...current, variants };
    });
  }

  function updateImage(index: number, patch: Partial<ImageForm>) { setForm((current) => ({ ...current, images: current.images.map((image, itemIndex) => itemIndex === index ? { ...image, ...patch } : image) })); }
  function addImage(path: string) { setForm((current) => ({ ...current, images: [...current.images, { path, alt_text: current.name, is_primary: current.images.length === 0, sort_order: String(current.images.length + 1) }] })); }
  function makePrimary(index: number) { setForm((current) => ({ ...current, images: current.images.map((image, itemIndex) => ({ ...image, is_primary: itemIndex === index })) })); }

  function removeImage(index: number) {
    const image = form.images[index];
    if (!image) return;
    if (image.id) setDeletedImageIds((current) => current.includes(image.id as number) ? current : [...current, image.id as number]);
    setForm((current) => {
      const images = current.images.filter((_, itemIndex) => itemIndex !== index);
      if (images.length > 0 && !images.some((item) => item.is_primary)) images[0] = { ...images[0], is_primary: true };
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
      if (!variant.sku.trim()) nextErrors[`variants.${index}.sku`] = "SKU là bắt buộc.";
      if (sku && skuMap.has(sku)) nextErrors[`variants.${index}.sku`] = "SKU bị trùng trong sản phẩm.";
      skuMap.set(sku, index);
      if (!Number.isFinite(price) || price < 0) nextErrors[`variants.${index}.price`] = "Giá phải từ 0 trở lên.";
      if (salePrice !== null && (!Number.isFinite(salePrice) || salePrice < 0 || salePrice > price)) nextErrors[`variants.${index}.sale_price`] = "Giá khuyến mãi không hợp lệ.";
      if (!Number.isInteger(stock) || stock < 0) nextErrors[`variants.${index}.stock_quantity`] = "Tồn kho phải là số nguyên từ 0 trở lên.";
    });
    if (form.variants.length === 0) nextErrors.variants = "Sản phẩm phải có ít nhất một biến thể.";
    else if (!form.variants.some((variant) => variant.is_default)) nextErrors.variants = "Hãy chọn một biến thể mặc định.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) { setMessage("Vui lòng kiểm tra lại các trường đang báo lỗi."); return; }
    const categoryId = Number(form.category_id);
    if (!Number.isInteger(categoryId) || !categories.some((category) => category.id === categoryId)) { setErrors((current) => ({ ...current, category_id: "Danh mục đã chọn không còn tồn tại. Vui lòng chọn lại danh mục." })); setMessage("Không thể lưu sản phẩm vì danh mục không hợp lệ."); return; }
    setSaving(true); setMessage("");
    try {
      const payload = {
        name: form.name,
        slug: form.slug || undefined,
        category_id: categoryId,
        brand_id: form.brand_id ? Number(form.brand_id) : undefined,
        short_description: form.short_description || undefined,
        description: form.description || undefined,
        status: form.status,
        featured: form.featured,
        deleted_variant_ids: deletedVariantIds,
        ...(id ? { deleted_image_ids: deletedImageIds } : {}),
        variants: form.variants.map((variant) => ({ ...(id && variant.id ? { id: variant.id } : {}), sku: variant.sku, name: variant.name, attributes: parseAttributes(variant.attributes), price: Number(variant.price), sale_price: variant.sale_price ? Number(variant.sale_price) : undefined, stock_quantity: Number(variant.stock_quantity), active: variant.active, is_default: variant.is_default })),
        images: form.images.filter((image) => image.path.trim()).map((image, index) => ({ ...(id && image.id ? { id: image.id } : {}), path: image.path, alt_text: image.alt_text, is_primary: image.is_primary, sort_order: Number(image.sort_order || index + 1) })),
      };
      if (id) await apiPatch(`/admin/products/${id}`, payload); else await apiPost("/admin/products", payload);
      router.push("/admin/products");
    } catch (reason) {
      if (reason instanceof ApiError) {
        setErrors(Object.fromEntries(Object.entries(reason.errors).map(([key, messages]) => [key, messages[0] ?? reason.message])));
        setMessage(reason.message);
      } else setMessage(toMessage(reason, "Không thể lưu sản phẩm."));
    } finally { setSaving(false); }
  }

  if (loading) return <p className="text-sm text-slate-500">Đang tải sản phẩm...</p>;

  return <form onSubmit={submit} className="grid gap-6 pb-8 xl:grid-cols-[minmax(0,1fr)_320px]" noValidate>
    <div className="min-w-0 space-y-6">
      {message ? <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800">{message}</div> : null}
      <SectionCard>
        <SectionTitle icon={Package} title="Thông tin sản phẩm" description="Đặt tên, đường dẫn và mô tả ngắn để khách hàng dễ nhận biết sản phẩm." />
        <div className="mt-5 grid gap-5">
          <Field label="Tên sản phẩm" value={form.name} required onChange={updateName} />
          <div><Field label="Slug" value={form.slug} onChange={(slug) => { setSlugEdited(true); setForm((current) => ({ ...current, slug })); }} /><p className="mt-1.5 text-xs text-slate-500">Slug được tự tạo từ tên sản phẩm và có thể chỉnh sửa.</p></div>
          <TextArea label="Mô tả ngắn" value={form.short_description} onChange={(short_description) => setForm((current) => ({ ...current, short_description }))} />
        </div>
      </SectionCard>

      <SectionCard>
        <div className="flex flex-wrap items-start justify-between gap-4"><SectionTitle icon={Settings2} title="Giá bán & biến thể" description="Quản lý SKU, giá, tồn kho và các phiên bản của sản phẩm." /><Button type="button" variant="secondary" onClick={addVariant} className="shrink-0"><Plus size={17} aria-hidden="true" /> Thêm biến thể</Button></div>
        {errors.variants || errors.deleted_variant_ids ? <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{errors.variants ?? errors.deleted_variant_ids}</p> : null}
        <AnimatePresence initial={false}>
          <div className="mt-5 grid gap-4">{form.variants.map((variant, index) => <VariantCard key={variant.id ?? `new-${index}`} variant={variant} index={index} error={errors} expanded={Boolean(expandedAttributes[index])} reducedMotion={Boolean(reducedMotion)} canDelete={form.variants.length > 1} onToggleAdvanced={() => setExpandedAttributes((current) => ({ ...current, [index]: !current[index] }))} onUpdate={(patch) => updateVariant(index, patch)} onDefault={() => selectDefaultVariant(index)} onRemove={() => removeVariant(index)} />)}</div>
        </AnimatePresence>
      </SectionCard>

      <SectionCard>
        <div className="flex flex-wrap items-start justify-between gap-4"><SectionTitle icon={ImageIcon} title="Hình ảnh sản phẩm" description="Tải ảnh lên, chọn ảnh đại diện và bổ sung văn bản thay thế." /><AdminImageUpload value="" directory="products" onChange={addImage} /></div>
        {errors.deleted_image_ids ? <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{errors.deleted_image_ids}</p> : null}
        {form.images.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{form.images.map((image, index) => <ImageCard key={image.id ?? `${image.path}-${index}`} image={image} productName={form.name} error={errors[`images.${index}.id`] ?? errors[`images.${index}.path`]} onUpdate={(patch) => updateImage(index, patch)} onPrimary={() => makePrimary(index)} onRemove={() => removeImage(index)} />)}</div> : <div className="mt-5 rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center"><ImageIcon className="mx-auto text-slate-400" size={28} aria-hidden="true" /><p className="mt-2 text-sm font-semibold text-slate-700">Chưa có hình ảnh</p><p className="mt-1 text-xs text-slate-500">Chọn file ở phía trên để thêm ảnh cho sản phẩm.</p></div>}
      </SectionCard>

      <SectionCard>
        <SectionTitle icon={FileText} title="Nội dung" description="Mô tả đầy đủ thông tin, tính năng và hướng dẫn sử dụng sản phẩm." />
        <div className="mt-5"><TextArea label="Mô tả đầy đủ" value={form.description} onChange={(description) => setForm((current) => ({ ...current, description }))} className="min-h-48" /></div>
      </SectionCard>
    </div>

    <aside className="order-first self-start space-y-4 xl:order-last xl:sticky xl:top-6">
      <SectionCard>
        <SectionTitle icon={Package} title="Phân loại" description="Chọn nhóm sản phẩm để hiển thị đúng trong cửa hàng." />
        <div className="mt-5 grid gap-4"><SelectField label="Danh mục" value={form.category_id} required disabled={optionsLoading} error={errors.category_id} options={categories.map((category) => ({ value: String(category.id), label: category.name }))} onChange={(category_id) => { setForm((current) => ({ ...current, category_id })); setErrors((current) => Object.fromEntries(Object.entries(current).filter(([key]) => key !== "category_id"))); }} /><SelectField label="Thương hiệu" value={form.brand_id} disabled={optionsLoading} options={[{ value: "", label: "Không có" }, ...brands.map((brand) => ({ value: String(brand.id), label: brand.name }))]} onChange={(brand_id) => setForm((current) => ({ ...current, brand_id }))} />{optionsLoading ? <p className="text-xs text-slate-500">Đang tải danh mục và thương hiệu...</p> : null}{optionsError ? <p role="alert" className="text-xs text-rose-700">{optionsError}</p> : null}</div>
      </SectionCard>
      <SectionCard>
        <SectionTitle icon={Star} title="Xuất bản" description="Kiểm soát trạng thái hiển thị của sản phẩm." />
        <div className="mt-5 grid gap-4"><SelectField label="Trạng thái" value={form.status} options={[{ value: "active", label: "Đang bán" }, { value: "inactive", label: "Đã tắt" }, { value: "draft", label: "Bản nháp" }]} onChange={(status) => setForm((current) => ({ ...current, status: status as Form["status"] }))} /><label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700"><span><span className="block text-slate-900">Nổi bật</span><span className="mt-0.5 block text-xs font-normal text-slate-500">Ưu tiên hiển thị ở khu vực nổi bật.</span></span><span className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition ${form.featured ? "bg-teal-600" : "bg-slate-300"}`}><input type="checkbox" checked={form.featured} onChange={(event) => setForm((current) => ({ ...current, featured: event.target.checked }))} className="peer sr-only" aria-label="Sản phẩm nổi bật" /><span className={`absolute top-1 size-4 rounded-full bg-white shadow transition ${form.featured ? "left-6" : "left-1"}`} /></span></label></div>
      </SectionCard>
      <SectionCard className="border-teal-100 bg-teal-50/40"><div className="grid gap-3"><Button type="submit" disabled={saving || optionsLoading || categories.length === 0}>{saving ? <><LoaderCircle size={17} className="animate-spin" aria-hidden="true" /> Đang lưu...</> : <><Save size={17} aria-hidden="true" /> Lưu sản phẩm</>}</Button><Button type="button" variant="secondary" onClick={() => router.push("/admin/products")}><span>Hủy</span></Button></div></SectionCard>
    </aside>
  </form>;
}

function VariantCard({ variant, index, error, expanded, reducedMotion, canDelete, onToggleAdvanced, onUpdate, onDefault, onRemove }: { variant: VariantForm; index: number; error: Record<string, string>; expanded: boolean; reducedMotion: boolean; canDelete: boolean; onToggleAdvanced: () => void; onUpdate: (patch: Partial<VariantForm>) => void; onDefault: () => void; onRemove: () => void }) {
  const summary = [variant.name || `Biến thể ${index + 1}`, variant.sku || "Chưa có SKU", variant.price ? formatVnd(variant.sale_price || variant.price) : "Chưa có giá", `tồn ${variant.stock_quantity || 0}`].join(" · ");
  return <motion.article initial={reducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reducedMotion ? undefined : { opacity: 0, height: 0 }} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-950">Biến thể {index + 1}</h3>{variant.is_default ? <Badge tone="brand">Mặc định</Badge> : null}<Badge tone={variant.active ? "success" : "neutral"}>{variant.active ? "Đang bán" : "Đã tắt"}</Badge></div><p className="mt-1 truncate text-xs text-slate-500">{summary}</p></div><div className="flex items-center gap-2"><Button type="button" variant="quiet" disabled={variant.is_default} onClick={onDefault} className="min-h-9 px-3 text-xs">{variant.is_default ? "Mặc định" : "Đặt mặc định"}</Button><Button type="button" variant="quiet" disabled={!canDelete} onClick={onRemove} className="min-h-9 px-3 text-rose-700 hover:bg-rose-50"><Trash2 size={15} aria-hidden="true" /><span className="sr-only">Xóa biến thể</span></Button></div></div><div className="mt-4 grid gap-4 md:grid-cols-2"><Field label="Tên biến thể" value={variant.name} required onChange={(name) => onUpdate({ name })} /><Field label="SKU" value={variant.sku} required error={error[`variants.${index}.sku`]} onChange={(sku) => onUpdate({ sku })} /><Field label="Giá bán" type="number" value={variant.price} required error={error[`variants.${index}.price`]} onChange={(price) => onUpdate({ price })} /><Field label="Giá khuyến mãi" type="number" value={variant.sale_price} error={error[`variants.${index}.sale_price`]} onChange={(sale_price) => onUpdate({ sale_price })} /><Field label="Tồn kho" type="number" value={variant.stock_quantity} required error={error[`variants.${index}.stock_quantity`]} onChange={(stock_quantity) => onUpdate({ stock_quantity })} /><label className="flex min-h-11 items-center gap-3 self-end rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"><input type="checkbox" checked={variant.active} onChange={(event) => onUpdate({ active: event.target.checked })} className="size-4 accent-teal-700" /> Đang bán</label></div><div className="mt-4 border-t border-slate-200 pt-3"><button type="button" onClick={onToggleAdvanced} className="flex w-full items-center justify-between text-left text-sm font-bold text-slate-700"><span className="inline-flex items-center gap-2"><Settings2 size={16} aria-hidden="true" /> Nâng cao</span>{expanded ? <ChevronUp size={17} aria-hidden="true" /> : <ChevronDown size={17} aria-hidden="true" />}</button><AnimatePresence initial={false}>{expanded ? <motion.div initial={reducedMotion ? false : { opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={reducedMotion ? undefined : { opacity: 0, height: 0 }} className="overflow-hidden"><div className="pt-3"><label className="text-sm font-semibold text-slate-700">Thuộc tính JSON<Input value={variant.attributes} onChange={(event) => onUpdate({ attributes: event.target.value })} placeholder='{"màu":"Đen","dung_lượng":"256GB"}' className="mt-1 font-mono text-xs" /></label><p className="mt-1 text-xs font-normal text-slate-500">Ví dụ: {`{"màu":"Đen","dung_lượng":"256GB"}`}</p></div></motion.div> : null}</AnimatePresence></div></motion.article>;
}

function ImageCard({ image, productName, error, onUpdate, onPrimary, onRemove }: { image: ImageForm; productName: string; error?: string; onUpdate: (patch: Partial<ImageForm>) => void; onPrimary: () => void; onRemove: () => void }) {
  return <article className={`overflow-hidden rounded-2xl border bg-white ${image.is_primary ? "border-teal-500 ring-2 ring-teal-100" : "border-slate-200"}`}><div className="relative flex aspect-[4/3] items-center justify-center bg-slate-100">{image.path ? <Image src={image.path} alt={image.alt_text || productName} fill unoptimized className="object-contain p-3" /> : <ImageIcon className="text-slate-400" size={28} aria-hidden="true" />}{image.is_primary ? <span className="absolute left-3 top-3"><Badge tone="brand"><Star size={12} className="mr-1" aria-hidden="true" /> Ảnh đại diện</Badge></span> : null}</div><div className="grid gap-3 p-3"><label className="text-xs font-semibold text-slate-700">Văn bản thay thế<Input value={image.alt_text} onChange={(event) => onUpdate({ alt_text: event.target.value })} placeholder="Mô tả ảnh" className="mt-1 h-10 text-sm" /></label><details className="rounded-xl bg-slate-50 px-3 py-2"><summary className="cursor-pointer text-xs font-semibold text-slate-600">Chi tiết ảnh</summary><label className="mt-2 block text-xs font-semibold text-slate-600">Đường dẫn<Input value={image.path} onChange={(event) => onUpdate({ path: event.target.value })} className="mt-1 h-9 font-mono text-[11px]" /></label></details><div className="flex items-center justify-between gap-2">{!image.is_primary ? <Button type="button" variant="quiet" onClick={onPrimary} className="min-h-9 px-3 text-xs"><Star size={14} aria-hidden="true" /> Đặt đại diện</Button> : <span className="text-xs font-semibold text-teal-700">Đang dùng làm ảnh đại diện</span>}<Button type="button" variant="quiet" onClick={onRemove} className="min-h-9 px-3 text-rose-700 hover:bg-rose-50"><Trash2 size={15} aria-hidden="true" /><span className="sr-only">Xóa ảnh</span></Button></div>{error ? <p className="text-xs text-rose-700">{error}</p> : null}</div></article>;
}

function SectionTitle({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) { return <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700"><Icon size={19} aria-hidden="true" /></span><div><h2 className="text-lg font-bold text-slate-950">{title}</h2><p className="mt-1 text-sm leading-5 text-slate-500">{description}</p></div></div>; }

function toVariantForm(variant: ProductVariant): VariantForm { return { id: variant.id, sku: variant.sku, name: variant.name, attributes: variant.attributes ? JSON.stringify(variant.attributes) : "", price: String(variant.price), sale_price: variant.sale_price == null ? "" : String(variant.sale_price), stock_quantity: String(variant.stock_quantity), active: variant.active, is_default: variant.is_default }; }
function toImageForm(image: ProductImage): ImageForm { return { id: image.id, path: image.path, alt_text: image.alt_text ?? "", is_primary: image.is_primary, sort_order: String(image.sort_order ?? image.id) }; }
function parseAttributes(value: string): Record<string, unknown> | undefined { if (!value.trim()) return undefined; try { const parsed = JSON.parse(value) as unknown; return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : undefined; } catch { return undefined; } }
function toMessage(reason: unknown, fallback: string): string { return reason instanceof Error ? reason.message : fallback; }

function Field({ label, value, onChange, type = "text", required = false, error, placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; error?: string; placeholder?: string }) { const errorId = error ? `${label.replace(/\s+/g, "-")}-error` : undefined; return <label className="text-sm font-semibold text-slate-700">{label}<Input required={required} type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={errorId} className={`mt-1 ${error ? "border-rose-500 focus-visible:border-rose-500 focus-visible:ring-rose-200" : ""}`} />{error ? <span id={errorId} className="mt-1 block text-xs font-normal text-rose-700">{error}</span> : null}</label>; }
function SelectField({ label, value, options, onChange, required = false, disabled = false, error }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void; required?: boolean; disabled?: boolean; error?: string }) { return <label className="text-sm font-semibold text-slate-700">{label}<Select required={required} disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} className={`mt-1 ${error ? "border-rose-500" : ""}`}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select>{error ? <span className="mt-1 block text-xs font-normal text-rose-700">{error}</span> : null}</label>; }
function TextArea({ label, value, onChange, className = "" }: { label: string; value: string; onChange: (value: string) => void; className?: string }) { return <label className="text-sm font-semibold text-slate-700">{label}<Textarea value={value} onChange={(event) => onChange(event.target.value)} className={`mt-1 ${className}`} /></label>; }
