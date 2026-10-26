import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";

// Hai nút Sửa/Xóa trong mỗi dòng danh sách; onDelete chỉ mở bước xác nhận ở trang cha.
export default function AdminRowActions({ editHref, itemName, onDelete }) {
  return <div className="flex items-center gap-2 whitespace-nowrap">
    <Link aria-label={`Sửa ${itemName}`} className="inline-flex h-10 w-[6rem] shrink-0 items-center justify-center gap-1.5 rounded-lg bg-indigo-700 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700" href={editHref}>
      <Pencil aria-hidden="true" size={15} />Sửa
    </Link>
    <button aria-label={`Xóa ${itemName}`} className="inline-flex h-10 w-[6rem] shrink-0 items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600" onClick={onDelete} type="button">
      <Trash2 aria-hidden="true" size={15} />Xóa
    </button>
  </div>;
}
