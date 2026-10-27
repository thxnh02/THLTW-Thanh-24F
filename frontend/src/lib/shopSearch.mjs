export function productSearchHref(query) {
  const value = String(query ?? "").trim();
  return value ? `/products?q=${encodeURIComponent(value)}` : "/products";
}

export function moveSuggestionIndex(currentIndex, optionCount, direction) {
  if (optionCount < 1) return -1;
  if (direction > 0) return currentIndex < 0 ? 0 : (currentIndex + 1) % optionCount;
  return currentIndex < 0 ? optionCount - 1 : (currentIndex - 1 + optionCount) % optionCount;
}
