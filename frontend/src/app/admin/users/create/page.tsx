"use client";
import Link from "next/link";
import { UserForm } from "@/components/admin/UserForm";
export default function CreateUserPage() { return <main className="mx-auto max-w-7xl px-4 py-8"><div className="mb-6 flex items-center justify-between"><h1 className="text-3xl font-bold text-slate-950">Tao tai khoan</h1><Link href="/admin/users" className="text-sm font-semibold">Quay lai</Link></div><UserForm /></main>; }
