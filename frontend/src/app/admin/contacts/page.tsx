"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useConfirm } from "@/contexts/ConfirmContext";
import { ApiError, apiDelete, apiGet, apiPatch } from "@/lib/api";
import type { Contact } from "@/types/api";

export default function AdminContactsPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    apiGet<{ data: Contact[] }>("/admin/contacts")
      .then((payload) => setContacts(payload.data ?? []))
      .catch((reason: Error) => {
        if (reason instanceof ApiError && reason.status === 401) {
          router.push("/admin/login");
          return;
        }
        setMessage(reason.message);
      });
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function update(contact: Contact, status: Contact["status"]) {
    await apiPatch(`/admin/contacts/${contact.id}`, { status, admin_note: contact.admin_note || undefined });
    setMessage("Da cap nhat lien he.");
    load();
  }

  async function remove(contact: Contact) {
    const accepted = await confirm({
      title: "Xoa lien he?",
      message: `Ban chac chan muon xoa lien he tu "${contact.name}"?`,
      confirmLabel: "Xoa",
    });

    if (!accepted) {
      return;
    }

    await apiDelete(`/admin/contacts/${contact.id}`);
    setMessage("Da xoa lien he.");
    load();
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-950">Lien he</h1>
      {message ? <p className="mt-3 text-sm text-teal-700">{message}</p> : null}
      <div className="mt-6 grid gap-4">
        {contacts.map((contact) => (
          <article key={contact.id} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-950">{contact.subject}</h2>
                <p className="text-sm text-slate-600">{contact.name} - {contact.email} - {contact.phone ?? ""}</p>
              </div>
              <span className="rounded-md bg-slate-100 px-3 py-1 text-sm font-semibold">{contact.status}</span>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{contact.message}</p>
            <textarea value={contact.admin_note ?? ""} onChange={(event) => setContacts((current) => current.map((item) => item.id === contact.id ? { ...item, admin_note: event.target.value } : item))} placeholder="Ghi chu admin" className="mt-4 min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <div className="mt-3 flex gap-2">
              {(["new", "processing", "resolved"] as const).map((status) => (
                <button key={status} type="button" onClick={() => update(contact, status)} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">
                  {status}
                </button>
              ))}
              <button type="button" onClick={() => remove(contact)} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">
                Xoa
              </button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
