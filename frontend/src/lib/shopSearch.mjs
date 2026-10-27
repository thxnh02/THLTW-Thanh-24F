export function productSearchHref(query) {
  const value = String(query ?? "").trim();
  return value ? `/products?q=${encodeURIComponent(value)}` : "/products";
}

export function categoryProductsHref(categoryId) {
  return `/products?category_id=${encodeURIComponent(String(categoryId))}`;
}

export function brandProductsHref(brandId) {
  return `/products?brand_id=${encodeURIComponent(String(brandId))}`;
}

export function postsPageHref(page) {
  const safePage = Math.max(1, Math.trunc(Number(page) || 1));
  return safePage === 1 ? "/posts" : `/posts?page=${safePage}`;
}

export function postsPageFromSearch(search) {
  const value = Number(new URLSearchParams(search).get("page") ?? 1);
  return Number.isInteger(value) && value > 0 ? value : 1;
}

export function isScrollInsideSuggestionList(target, listElement) {
  return Boolean(listElement && target && listElement.contains(target));
}

export function searchEscapeAction(suggestionsOpen) {
  return suggestionsOpen ? "close-suggestions" : "close-panel";
}

export function moveSuggestionIndex(currentIndex, optionCount, direction) {
  if (optionCount < 1) return -1;
  if (direction > 0) return currentIndex < 0 ? 0 : (currentIndex + 1) % optionCount;
  return currentIndex < 0 ? optionCount - 1 : (currentIndex - 1 + optionCount) % optionCount;
}
