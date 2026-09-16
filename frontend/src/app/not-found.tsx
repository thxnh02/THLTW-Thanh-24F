import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-16">
      <div className="rounded-md border border-slate-200 bg-white p-8">
        <h1 className="text-3xl font-bold text-slate-950">Khong tim thay trang</h1>
        <p className="mt-2 text-slate-600">Duong dan nay khong ton tai hoac da thay doi.</p>
        <Link href="/" className="mt-5 inline-block rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
          Ve trang chu
        </Link>
      </div>
    </main>
  );
}
