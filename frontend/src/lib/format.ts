export function formatVnd(value?: number | string | null): string {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function effectivePrice(price?: number | string | null, salePrice?: number | string | null): number {
  return Number(salePrice ?? price ?? 0);
}
