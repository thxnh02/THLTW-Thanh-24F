"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, LoaderCircle, Search, X } from "lucide-react";
import productServices from "@/services/productServices";
import { productSearchHref, moveSuggestionIndex } from "@/lib/shopSearch.mjs";

const price = (value) => `${Number(value ?? 0).toLocaleString("vi-VN")} đ`;

export default function GlobalProductSearch({ className = "" }) {
  const router = useRouter();
  const inputId = useId();
  const listId = useId();
  const root = useRef(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const search = query.trim();
    if (search.length < 2) {
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      productServices.getSuggestions({ q: search }, { signal: controller.signal })
        .then(({ data }) => {
          if (controller.signal.aborted) return;
          setSuggestions(Array.isArray(data.data) ? data.data : []);
          setActiveIndex(-1);
          setOpen(true);
        })
        .catch((error) => {
          if (controller.signal.aborted || error.code === "ERR_CANCELED") return;
          setSuggestions([]);
          setActiveIndex(-1);
        })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  const navigateToSearch = (event) => {
    event?.preventDefault();
    const target = productSearchHref(query);
    setOpen(false);
    setSuggestions([]);
    router.push(target);
  };

  const selectSuggestion = (suggestion) => {
    setOpen(false);
    setSuggestions([]);
    router.push(`/products/${encodeURIComponent(suggestion.slug)}`);
  };

  const onKeyDown = (event) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "ArrowDown" && suggestions.length) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => moveSuggestionIndex(index, suggestions.length, 1));
    } else if (event.key === "ArrowUp" && suggestions.length) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => moveSuggestionIndex(index, suggestions.length, -1));
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    } else if (event.key === "Enter" && activeIndex >= 0 && suggestions[activeIndex]) {
      event.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    }
  };

  return <div className={`relative w-full ${className}`} ref={root}>
    <form action="/products" className="flex min-h-11 items-center gap-2 rounded-full border border-[#d8e2da] bg-white px-3 shadow-sm transition focus-within:border-[#37665b] focus-within:ring-2 focus-within:ring-[#37665b]/15" onSubmit={navigateToSearch} role="search">
      <label className="sr-only" htmlFor={inputId}>Tìm sản phẩm</label>
      <Search aria-hidden="true" className="size-4 shrink-0 text-[#587168]" />
      <input
        aria-activedescendant={open && activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined}
        aria-autocomplete="list"
        aria-controls={open ? listId : undefined}
        aria-expanded={open && query.trim().length >= 2}
        aria-label="Tìm điện thoại, laptop, phụ kiện"
        autoComplete="off"
        className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-[#19352f] outline-none placeholder:text-slate-400"
        id={inputId}
        maxLength={100}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
        onFocus={() => { if (query.trim().length >= 2) setOpen(true); }}
        onKeyDown={onKeyDown}
        placeholder="Tìm điện thoại, laptop, phụ kiện..."
        role="combobox"
        value={query}
      />
      {query && <button aria-label="Xóa nội dung tìm kiếm" className="grid size-8 shrink-0 place-items-center rounded-full text-slate-500 hover:bg-[#eaf1eb] focus-visible:outline-2 focus-visible:outline-[#37665b]" onClick={() => { setQuery(""); setSuggestions([]); setOpen(false); }} type="button"><X aria-hidden="true" className="size-4" /></button>}
      <button aria-label="Tìm kiếm" className="grid size-8 shrink-0 place-items-center rounded-full bg-[#193f36] text-white transition hover:bg-[#28564d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#37665b]" type="submit">{loading ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Search aria-hidden="true" className="size-4" />}</button>
    </form>

    {open && query.trim().length >= 2 && <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-[#d8e2da] bg-white shadow-xl">
      {loading && suggestions.length === 0 && <p className="px-4 py-3 text-sm text-slate-500" role="status">Đang tìm sản phẩm…</p>}
      {!loading && suggestions.length === 0 && <p className="px-4 py-3 text-sm text-slate-500">Chưa có gợi ý. Nhấn Enter để xem kết quả.</p>}
      <div aria-label="Gợi ý sản phẩm" className="max-h-80 overflow-y-auto" id={listId} role="listbox">
      {suggestions.map((suggestion, index) => <button
        aria-selected={activeIndex === index}
        className={`flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-[#f1f5f1] focus-visible:bg-[#f1f5f1] focus-visible:outline-none ${activeIndex === index ? "bg-[#eaf1eb]" : ""}`}
        id={`${listId}-option-${index}`}
        key={suggestion.id}
        onClick={() => selectSuggestion(suggestion)}
        onMouseDown={(event) => event.preventDefault()}
        onMouseEnter={() => setActiveIndex(index)}
        role="option"
        type="button"
      >
        <span className="min-w-0"><span className="block truncate text-sm font-semibold text-[#19352f]">{suggestion.name}</span><span className="mt-1 block text-xs text-slate-500">{suggestion.brand || "Sản phẩm"}</span></span>
        <span className="shrink-0 text-xs font-semibold text-[#37665b]">{price(suggestion.sale_price != null && Number(suggestion.sale_price) >= 0 && Number(suggestion.sale_price) < Number(suggestion.price) ? suggestion.sale_price : suggestion.price)}</span>
      </button>)}
      </div>
      <button className="flex min-h-11 w-full items-center justify-between border-t border-[#e7eee8] px-4 text-sm font-semibold text-[#37665b] hover:bg-[#f8faf8]" onClick={navigateToSearch} onMouseDown={(event) => event.preventDefault()} type="button">
        <span>Xem tất cả kết quả cho “{query.trim()}”</span><ArrowUpRight aria-hidden="true" className="size-4" />
      </button>
    </div>}
  </div>;
}
