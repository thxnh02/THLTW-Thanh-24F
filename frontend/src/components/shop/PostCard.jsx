import Link from "next/link";
import { ArrowUpRight, BookOpen } from "lucide-react";

export default function PostCard({ post }) {
  return <article className="group flex h-full flex-col rounded-[1.5rem] border border-[#e1e9e2] bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg sm:p-7">
    <div className="flex items-center justify-between"><span className="grid size-11 place-items-center rounded-2xl bg-[#eaf1eb] text-[#37665b]"><BookOpen aria-hidden="true" size={20} /></span><time className="text-xs text-slate-500" dateTime={post.created_at}>{new Date(post.created_at).toLocaleDateString("vi-VN")}</time></div>
    <h2 className="mt-7 text-xl font-semibold leading-snug tracking-tight text-[#19352f]">{post.title}</h2>
    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{post.excerpt}</p>
    <Link aria-label={`Đọc bài viết ${post.title}`} className="mt-auto inline-flex min-h-11 items-center gap-2 pt-6 text-sm font-semibold text-[#37665b] group-hover:text-[#19352f]" href={`/posts/${encodeURIComponent(post.slug)}`}>Đọc bài viết <ArrowUpRight aria-hidden="true" size={16} /></Link>
  </article>;
}
