import Link from "next/link";
import { ArrowUpRight, BookOpen } from "lucide-react";

export default function PostCard({ post }) {
  return <article className="group flex h-full min-w-0 flex-col rounded-2xl border border-[#e1e9e2] bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none">
    <div className="flex items-center justify-between gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eaf1eb] text-[#37665b]"><BookOpen aria-hidden="true" size={18} /></span><time className="text-xs text-slate-500" dateTime={post.created_at}>{new Date(post.created_at).toLocaleDateString("vi-VN")}</time></div>
    <h2 className="mt-4 line-clamp-2 break-words text-lg font-semibold leading-snug tracking-tight text-[#19352f]">{post.title}</h2>
    <p className="mt-2 line-clamp-3 text-sm leading-5 text-slate-600">{post.excerpt}</p>
    <Link aria-label={`Đọc bài viết ${post.title}`} className="mt-auto inline-flex min-h-11 items-center gap-2 pt-3 text-sm font-semibold text-[#37665b] group-hover:text-[#19352f] focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#37665b]" href={`/posts/${encodeURIComponent(post.slug)}`}>Đọc bài viết <ArrowUpRight aria-hidden="true" size={16} /></Link>
  </article>;
}
