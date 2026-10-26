"use client";

import { useState } from "react";
import { catalogImageUrl } from "@/lib/catalogImage";

export default function AdminCatalogThumbnail({ src, label }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <span aria-label={`Không có ảnh ${label}`} className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-slate-100 text-[10px] font-semibold text-slate-500" role="img">Không ảnh</span>;

  // API images and legacy external URLs do not need Next image optimization.
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" loading="lazy" src={catalogImageUrl(src)} onError={() => setFailed(true)} />;
}
