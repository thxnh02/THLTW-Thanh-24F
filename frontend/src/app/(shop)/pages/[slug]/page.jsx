import { notFound } from 'next/navigation';

export default async function ContentPage({ params }) {
  const { slug } = await params;
  const origin = (process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
  let response;
  try { response = await fetch(`${origin}/api/pages/${encodeURIComponent(slug)}`, { cache: 'no-store' }); }
  catch { return <p className="rounded-xl border p-5 text-rose-700" role="alert">Không thể tải trang. Vui lòng thử lại.</p>; }
  if (response.status === 404) notFound();
  if (!response.ok) return <p className="rounded-xl border p-5 text-rose-700" role="alert">Không thể tải trang. Vui lòng thử lại.</p>;
  const { data: page } = await response.json();
  return <article className="mx-auto max-w-3xl rounded-2xl border bg-white p-6 sm:p-9"><h1 className="section-title">{page.title}</h1><div className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-700">{page.body}</div></article>;
}
