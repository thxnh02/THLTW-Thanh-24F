"use client";

import { useEffect } from "react";

export default function SearchPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    window.location.replace(`/products?${params.toString()}`);
  }, []);

  return <main className="mx-auto max-w-7xl px-4 py-12">Đang chuyển đến kết quả tìm kiếm...</main>;
}
