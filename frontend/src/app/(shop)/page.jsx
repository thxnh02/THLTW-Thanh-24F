import Link from "next/link";

export default function HomePage() {
  return <section className="space-y-4"><h1 className="text-3xl font-bold">CT_24F — Ecommerce course project</h1><p>Ví dụ nhỏ dùng Laravel JSON API, Axios và Next.js.</p><div className="flex gap-3"><Link className="rounded bg-blue-600 px-4 py-2 text-white" href="/categories">Xem danh mục</Link><Link className="rounded border px-4 py-2" href="/admin">Vào quản trị</Link></div></section>;
}
