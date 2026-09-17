"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useConfirm } from "@/contexts/ConfirmContext";
import { ApiError, apiDelete, apiGetList, apiPatch, apiPost } from "@/lib/api";
import type { User } from "@/types/api";

type UserForm = {
  id?: number;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: User["role"];
  status: "active" | "locked";
};

const emptyForm: UserForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "member",
  status: "active",
};

export default function AdminUsersPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");

  const load = useCallback(() => {
    const search = query ? `?q=${encodeURIComponent(query)}` : "";
    apiGetList<User>(`/admin/users${search}`)
      .then(setUsers)
      .catch((reason: Error) => {
        if (reason instanceof ApiError && reason.status === 401) {
          router.push("/admin/login");
          return;
        }
        setMessage(reason.message);
      });
  }, [query, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (form.id) {
      await apiPatch(`/admin/users/${form.id}`, toPayload(form, false));
      setMessage("Da cap nhat tai khoan.");
    } else {
      await apiPost("/admin/users", toPayload(form, true));
      setMessage("Da tao tai khoan.");
    }

    setForm(emptyForm);
    load();
  }

  function edit(user: User) {
    setForm({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
      password: "",
      role: user.role,
      status: user.status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(user: User) {
    setMessage("");
    const accepted = await confirm({
      title: "Xoa tai khoan?",
      message: `Ban chac chan muon xoa tai khoan "${user.email}"?`,
      confirmLabel: "Xoa",
    });

    if (!accepted) {
      return;
    }

    try {
      await apiDelete(`/admin/users/${user.id}`);
      setMessage("Da xoa tai khoan.");
      load();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Khong the xoa tai khoan.");
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-slate-950">Quan ly thanh vien</h1>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            load();
          }}
          className="flex gap-2"
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tim ten, email, phone"
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
          />
          <button className="rounded-md bg-slate-950 px-4 text-sm font-semibold text-white">Tim</button>
        </form>
      </div>

      <form onSubmit={submit} className="grid gap-4 rounded-md border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-4">
        <Input label="Ho ten" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
        <Input label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} required />
        <Input label="Dien thoai" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
        <Input label={form.id ? "Mat khau moi" : "Mat khau"} type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} required={!form.id} />
        <label className="block text-sm font-semibold text-slate-700">
          Vai tro
          <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as UserForm["role"] })} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal">
            <option value="member">Member</option>
            <option value="staff">Staff</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Trang thai
          <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as UserForm["status"] })} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal">
            <option value="active">Active</option>
            <option value="locked">Locked</option>
          </select>
        </label>
        <div className="flex items-end gap-2 lg:col-span-2">
          <button className="h-10 rounded-md bg-slate-950 px-5 text-sm font-semibold text-white">
            {form.id ? "Cap nhat" : "Tao tai khoan"}
          </button>
          {form.id ? (
            <button type="button" onClick={() => setForm(emptyForm)} className="h-10 rounded-md border border-slate-300 px-5 text-sm font-semibold">
              Huy sua
            </button>
          ) : null}
        </div>
      </form>

      {message ? <p className="mt-3 text-sm text-teal-700">{message}</p> : null}

      <div className="mt-6 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="p-3">Tai khoan</th>
              <th className="p-3">Dien thoai</th>
              <th className="p-3">Vai tro</th>
              <th className="p-3">Trang thai</th>
              <th className="p-3">Don hang</th>
              <th className="p-3">Thao tac</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-slate-200">
                <td className="p-3">
                  <span className="block font-semibold">{user.name}</span>
                  <span className="text-slate-500">{user.email}</span>
                </td>
                <td className="p-3">{user.phone ?? "-"}</td>
                <td className="p-3">{user.role}</td>
                <td className="p-3">{user.status}</td>
                <td className="p-3">{user.orders_count ?? 0}</td>
                <td className="flex gap-2 p-3">
                  <button type="button" onClick={() => edit(user)} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">
                    Sua
                  </button>
                  <button type="button" onClick={() => remove(user)} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">
                    Xoa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal outline-none focus:border-slate-950"
      />
    </label>
  );
}

function toPayload(form: UserForm, includePassword: boolean) {
  return {
    name: form.name,
    email: form.email,
    phone: form.phone || undefined,
    password: includePassword || form.password ? form.password : undefined,
    role: form.role,
    status: form.status,
  };
}
