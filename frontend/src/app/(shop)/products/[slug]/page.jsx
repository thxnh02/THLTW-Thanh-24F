"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, ChevronRight, Star } from "lucide-react";
import ProductCard, { formatPrice } from "@/components/shop/ProductCard";
import { catalogImageUrl } from "@/lib/catalogImage";
import productServices from "@/services/productServices";
import customerAccountServices from "@/services/customerAccountServices";
import { useCart } from "@/contexts/CartContext";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";

function ReviewStars({ value, size = 16 }) {
  return <span aria-label={`${value} trên 5 sao`} className="inline-flex items-center gap-0.5 text-amber-500">{[1, 2, 3, 4, 5].map((star) => <Star aria-hidden="true" className={star <= value ? "fill-current" : "fill-transparent"} key={star} size={size} />)}</span>;
}

function isOnSale(product) {
  return product?.sale_price != null && Number(product.sale_price) >= 0 && Number(product.sale_price) < Number(product.price);
}

export default function ProductDetailPage() {
  const router = useRouter();
  const { add } = useCart();
  const { user, loading: authLoading } = useCustomerAuth();
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [cartNotice, setCartNotice] = useState('');
  const [reviewResult, setReviewResult] = useState(null);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewDraft, setReviewDraft] = useState({ rating: 5, title: '', body: '' });
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const [result, setResult] = useState(null);
  const [retry, setRetry] = useState(0);
  const requestKey = `${slug ?? ""}:${retry}`;
  const loading = !result || result.key !== requestKey;
  const reviewRequestKey = `${slug ?? ""}:${retry}:${user?.id ?? 'guest'}`;
  const reviewData = reviewResult?.key === reviewRequestKey ? reviewResult.data : null;
  const reviewError = reviewResult?.key === reviewRequestKey ? reviewResult.error : '';
  const reviewLoading = authLoading || !reviewResult || reviewResult.key !== reviewRequestKey;
  const product = loading ? null : result.product;
  const related = loading ? [] : result.related;
  const error = loading ? "" : result.error;

  useEffect(() => {
    if (!slug) return undefined;
    let active = true;
    const controller = new AbortController();
    productServices.getPublicProduct(slug, { signal: controller.signal }).then(({ data }) => {
      if (!active) return;
      const current = data.data;
      setQuantity(1);
      setResult({ key: requestKey, product: current, related: [], error: "" });
      productServices.getRelatedProducts(slug, { limit: 4 }, { signal: controller.signal })
        .then((response) => {
          if (active) setResult({ key: requestKey, product: current, related: Array.isArray(response.data.data) ? response.data.data : [], error: "" });
        })
        .catch((requestError) => {
          if (active && requestError.code !== "ERR_CANCELED") setResult((previous) => previous?.key === requestKey ? { ...previous, related: [] } : previous);
        });
    }).catch((requestError) => {
      if (!active || requestError.code === "ERR_CANCELED") return;
      setResult({ key: requestKey, product: null, related: [], error: requestError.response?.status === 404 ? "Không tìm thấy sản phẩm này." : "Không thể tải sản phẩm. Vui lòng thử lại." });
    });

    return () => { active = false; controller.abort(); };
  }, [slug, retry, requestKey]);

  useEffect(() => {
    if (!slug || authLoading) return undefined;
    let active = true;
    productServices.getProductReviews(slug).then(({ data }) => {
      if (!active) return;
      const current = data.data;
      setReviewResult({ key: reviewRequestKey, data: current, error: '' });
      setReviewDraft(current.my_review
        ? { rating: current.my_review.rating, title: current.my_review.title ?? '', body: current.my_review.body ?? '' }
        : { rating: 5, title: '', body: '' });
    }).catch(() => {
      if (active) setReviewResult({ key: reviewRequestKey, data: null, error: 'Không thể tải đánh giá lúc này. Vui lòng thử lại sau.' });
    });
    return () => { active = false; };
  }, [slug, authLoading, reviewRequestKey]);

  const retryLoad = () => setRetry((value) => value + 1);

  if (loading) return <section aria-live="polite" className="rounded-2xl border border-dashed border-[#d6dfd9] p-8 text-center text-sm text-slate-500" role="status">Đang tải thông tin sản phẩm…</section>;
  if (error) return <section className="mx-auto max-w-3xl rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center" role="alert"><p className="text-lg font-semibold text-rose-900">{error}</p>{error !== "Không tìm thấy sản phẩm này." && <button className="mt-4 min-h-11 rounded-full bg-[#193f36] px-5 text-sm font-semibold text-white" onClick={retryLoad} type="button">Thử lại</button>}<Link className="mt-4 flex min-h-11 items-center justify-center gap-2 text-sm font-semibold text-[#37665b]" href="/products"><ArrowLeft aria-hidden="true" size={16} /> Trở lại sản phẩm</Link></section>;
  if (!product) return null;

  const onSale = isOnSale(product);
  const imageUrl = catalogImageUrl(product.image);
  const categoryHref = product.category?.id ? `/products?category_id=${product.category.id}` : "/products";
  const brandHref = product.brand?.id ? `/products?brand_id=${product.brand.id}` : "/products";
  const addItem = async (buyNow) => {
    if (buyNow) { router.push(`/checkout?buy=${product.id}&quantity=${quantity}`); return; }
    if (!user) { router.push(`/login?returnTo=${encodeURIComponent(`/products/${product.slug}`)}`); return; }
    setAdding(true); setCartNotice('');
    try {
      await add(product.id, quantity);
      setCartNotice('Đã thêm sản phẩm vào giỏ.');
    }
    catch (requestError) { setCartNotice(requestError.response?.data?.message ?? 'Không thể thêm sản phẩm vào giỏ.'); }
    finally { setAdding(false); }
  };
  const submitReview = async (event) => {
    event.preventDefault();
    if (!user) { router.push(`/login?returnTo=${encodeURIComponent(`/products/${product.slug}`)}`); return; }
    setReviewSaving(true);
    setReviewMessage('');
    try {
      await customerAccountServices.reviewProduct(product.id, reviewDraft);
      const { data } = await productServices.getProductReviews(slug);
      setReviewResult({ key: reviewRequestKey, data: data.data, error: '' });
      setReviewMessage('Đánh giá của bạn đã được lưu.');
    } catch (requestError) {
      setReviewMessage(requestError.response?.data?.message ?? 'Không thể lưu đánh giá. Vui lòng thử lại.');
    } finally { setReviewSaving(false); }
  };

  return <div className="space-y-8 pb-10">
    <nav aria-label="Đường dẫn" className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
      <Link className="min-h-10 inline-flex items-center hover:text-[#37665b]" href="/">Trang chủ</Link><ChevronRight aria-hidden="true" size={15} />
      <Link className="min-h-10 inline-flex items-center hover:text-[#37665b]" href="/products">Sản phẩm</Link><ChevronRight aria-hidden="true" size={15} />
      {product.category?.name && <><Link className="min-h-10 inline-flex items-center hover:text-[#37665b]" href={categoryHref}>{product.category.name}</Link><ChevronRight aria-hidden="true" size={15} /></>}
      <span aria-current="page" className="max-w-full truncate font-medium text-[#19352f]">{product.name}</span>
    </nav>

    <section className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-7">
      <div aria-label={imageUrl ? `Ảnh ${product.name}` : `Chưa có ảnh cho ${product.name}`} className="relative flex aspect-[4/3] w-full max-w-[560px] items-center justify-center overflow-hidden rounded-2xl border border-[#e4ebe5] bg-gradient-to-br from-[#eaf1eb] to-[#d5e3d8]" role="img" style={imageUrl ? { backgroundImage: `linear-gradient(#142f2c08,#142f2c08), url("${imageUrl}")`, backgroundPosition: "center", backgroundSize: "contain", backgroundRepeat: "no-repeat" } : undefined}>
        {!imageUrl && <span aria-hidden="true" className="font-serif text-8xl italic text-[#244941]/20">{product.name?.charAt(0) ?? "✳"}</span>}
        {onSale && <span className="absolute left-4 top-4 rounded-full bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white">Đang khuyến mãi</span>}
      </div>

      <div className="rounded-2xl border border-[#e4ebe5] bg-white p-5 shadow-sm sm:p-6">
        <p className="eyebrow">Chi tiết sản phẩm</p>
        <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-[#19352f] sm:text-3xl">{product.name}</h1>
        {reviewData?.meta && <div className="mt-3 flex items-center gap-2 text-sm"><ReviewStars value={Math.round(reviewData.meta.average_rating ?? 0)} size={15} /><span className="font-semibold text-[#19352f]">{reviewData.meta.average_rating ?? '—'}</span><span className="text-slate-500">({reviewData.meta.total} đánh giá)</span></div>}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          {product.brand?.name ? <Link className="min-h-10 inline-flex items-center rounded-full bg-[#eaf1eb] px-4 font-medium text-[#37665b] hover:bg-[#dfeae1]" href={brandHref}>{product.brand.name}</Link> : <span className="text-slate-500">Chưa gán thương hiệu</span>}
          {product.category?.name && <Link className="min-h-10 inline-flex items-center gap-1 text-[#37665b] hover:underline" href={categoryHref}>{product.category.name}<ArrowUpRight aria-hidden="true" size={14} /></Link>}
        </div>
        <div className="mt-5 border-y border-[#edf1ed] py-4">
          <p className={`text-2xl font-bold ${onSale ? "text-rose-700" : "text-[#37665b]"}`}>{formatPrice(onSale ? product.sale_price : product.price)}</p>
          {onSale && <p className="mt-1 text-sm text-slate-500">Giá gốc <span className="ml-1 line-through">{formatPrice(product.price)}</span></p>}
        </div>
        <div className="flex flex-wrap items-end gap-2 border-b border-[#edf1ed] py-4"><label className="text-sm font-medium text-[#19352f]" htmlFor="product-quantity">Số lượng<input className="mt-1 block h-11 w-20 rounded-xl border border-[#b7d0bd] px-3" id="product-quantity" min={1} max={Math.min(20, product.stock_quantity ?? 20)} onChange={(event) => { const next = Number(event.target.value); if (Number.isInteger(next) && next >= 1 && next <= Math.min(20, product.stock_quantity ?? 20)) setQuantity(next); }} type="number" value={quantity} /></label><button className="min-h-11 rounded-full border border-[#b7d0bd] px-5 text-sm font-semibold text-[#28584a] disabled:opacity-50" disabled={adding || product.stock_quantity === 0 || authLoading} onClick={() => addItem(false)} type="button">{product.stock_quantity === 0 ? 'Hết hàng' : authLoading ? 'Đang kiểm tra…' : user ? 'Thêm vào giỏ' : 'Đăng nhập để thêm vào giỏ'}</button><button className="min-h-11 rounded-full bg-[#193f36] px-5 text-sm font-semibold text-white disabled:opacity-50" disabled={adding || product.stock_quantity === 0 || authLoading} onClick={() => addItem(true)} type="button">Mua ngay</button>{cartNotice && <p aria-live="polite" className="w-full text-sm text-[#37665b]">{cartNotice}</p>}</div>
        <div className="py-4">
          <h2 className="text-base font-semibold text-[#19352f]">Mô tả</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{product.description?.trim() || "Chưa có mô tả cho sản phẩm này."}</p>
        </div>
        <div className="flex flex-wrap gap-3 border-t border-[#edf1ed] pt-5">
          {product.category?.name && <Link className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#193f36] px-5 text-sm font-semibold text-white transition hover:bg-[#28564d]" href={categoryHref}>Xem thêm {product.category.name}<ArrowUpRight aria-hidden="true" size={16} /></Link>}
          <Link className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#d8e2da] px-5 text-sm font-semibold text-[#37665b] hover:bg-[#f4f7f4]" href="/products"><ArrowLeft aria-hidden="true" size={16} /> Tất cả sản phẩm</Link>
        </div>
      </div>
    </section>

    <section aria-labelledby="product-reviews-heading" className="rounded-2xl border border-[#e4ebe5] bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#edf1ed] pb-4"><div><p className="eyebrow">Chia sẻ trải nghiệm</p><h2 className="mt-1 text-xl font-semibold text-[#19352f]" id="product-reviews-heading">Đánh giá sản phẩm</h2></div>{reviewData?.meta && <div className="text-right"><p className="text-2xl font-bold text-[#193f36]">{reviewData.meta.average_rating ?? '—'}<span className="ml-1 text-sm font-normal text-slate-500">/ 5</span></p><p className="text-xs text-slate-500">{reviewData.meta.total} đánh giá</p></div>}</div>
      {reviewLoading ? <p className="py-5 text-sm text-slate-500" role="status">Đang tải đánh giá…</p> : <>
        {user && reviewData?.can_review ? <form className="mt-5 rounded-xl bg-[#f5f8f5] p-4 sm:p-5" onSubmit={submitReview}>
          <h3 className="font-semibold text-[#19352f]">{reviewData.my_review ? 'Chỉnh sửa đánh giá của bạn' : 'Bạn đã nhận được sản phẩm này'}</h3>
          <fieldset className="mt-3"><legend className="text-sm font-medium text-[#29483f]">Mức đánh giá</legend><div className="mt-1 flex gap-1">{[1, 2, 3, 4, 5].map((rating) => <button aria-label={`${rating} sao`} aria-pressed={reviewDraft.rating === rating} className="rounded-md p-1 text-amber-500 focus-visible:outline-2 focus-visible:outline-[#37665b]" key={rating} onClick={() => setReviewDraft((draft) => ({ ...draft, rating }))} type="button"><Star aria-hidden="true" className={rating <= reviewDraft.rating ? 'fill-current' : 'fill-transparent'} size={22} /></button>)}</div></fieldset>
          <label className="mt-3 block text-sm font-medium text-[#29483f]" htmlFor="review-title">Tiêu đề (không bắt buộc)<input className="mt-1.5 min-h-11 w-full rounded-xl border border-[#d8e2da] bg-white px-3 text-sm outline-none focus:border-[#6d9588]" id="review-title" maxLength={120} onChange={(event) => setReviewDraft((draft) => ({ ...draft, title: event.target.value }))} value={reviewDraft.title} /></label>
          <label className="mt-3 block text-sm font-medium text-[#29483f]" htmlFor="review-body">Nhận xét<textarea className="mt-1.5 min-h-28 w-full rounded-xl border border-[#d8e2da] bg-white p-3 text-sm outline-none focus:border-[#6d9588]" id="review-body" maxLength={2000} minLength={10} onChange={(event) => setReviewDraft((draft) => ({ ...draft, body: event.target.value }))} required value={reviewDraft.body} /></label>
          <button className="mt-3 min-h-11 rounded-full bg-[#193f36] px-5 text-sm font-semibold text-white disabled:opacity-50" disabled={reviewSaving || reviewDraft.body.trim().length < 10} type="submit">{reviewSaving ? 'Đang lưu…' : reviewData.my_review ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}</button>
        </form> : user ? <p className="mt-5 rounded-xl bg-[#f5f8f5] p-4 text-sm leading-6 text-slate-600">Bạn có thể đánh giá sản phẩm sau khi đơn hàng có sản phẩm này được xác nhận đã giao.</p> : <div className="mt-5 rounded-xl bg-[#f5f8f5] p-4 text-sm text-slate-600">Đăng nhập và mua sản phẩm để gửi đánh giá đã xác thực. <Link className="ml-1 font-semibold text-[#37665b] underline" href={`/login?returnTo=${encodeURIComponent(`/products/${product.slug}`)}`}>Đăng nhập</Link></div>}
        {reviewError && <p className="mt-3 text-sm text-rose-700" role="alert">{reviewError}</p>}
        {reviewData?.my_review_hidden && <p className="mt-3 text-sm text-amber-800">Đánh giá của bạn đang được ẩn. Bạn có thể chỉnh sửa và liên hệ cửa hàng để được xem xét.</p>}
        {reviewMessage && <p aria-live="polite" className="mt-3 text-sm text-[#37665b]" role="status">{reviewMessage}</p>}
        {!reviewData && !reviewError ? <p className="py-5 text-sm text-slate-500">Chưa có đánh giá.</p> : null}
        {reviewData?.reviews?.length ? <div className="mt-5 divide-y divide-[#edf1ed]">{reviewData.reviews.map((review) => <article className="py-4 first:pt-0 last:pb-0" key={review.id}><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><ReviewStars value={review.rating} size={14} /><span className="text-sm font-semibold text-[#19352f]">{review.reviewer_name}</span></div><time className="text-xs text-slate-500" dateTime={review.created_at}>{new Date(review.created_at).toLocaleDateString('vi-VN')}</time></div>{review.title && <h3 className="mt-2 text-sm font-semibold text-[#19352f]">{review.title}</h3>}<p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">{review.body}</p></article>)}</div> : reviewData && <p className="py-5 text-sm text-slate-500">Chưa có đánh giá nào. Hãy là người đầu tiên chia sẻ sau khi nhận hàng.</p>}
      </>}
    </section>

    {related.length > 0 && <section aria-labelledby="related-products-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Cùng danh mục hoặc thương hiệu</p><h2 className="section-title" id="related-products-heading">Sản phẩm liên quan</h2></div>{product.category?.name && <Link className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#37665b] hover:underline" href={categoryHref}>Xem danh mục<ArrowUpRight aria-hidden="true" size={15} /></Link>}</div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">{related.map((item) => <ProductCard key={item.id} product={item} />)}</div>
    </section>}
  </div>;
}
