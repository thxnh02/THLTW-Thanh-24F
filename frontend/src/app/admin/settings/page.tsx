"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AdminImageUpload } from "@/components/AdminImageUpload";
import { ApiError, apiGet, apiPut } from "@/lib/api";
import type { Setting } from "@/types/api";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    apiGet<Setting[]>("/admin/settings")
      .then(setSettings)
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

  async function save() {
    await apiPut("/admin/settings", { settings });
    setMessage("Da luu cau hinh.");
    load();
  }

  function addSetting() {
    setSettings((current) => [...current, { id: Date.now(), key: "", value: "", type: "string" }]);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-slate-950">Cau hinh website</h1>
        <button type="button" onClick={addSetting} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">Them key</button>
      </div>
      {message ? <p className="mt-3 text-sm text-teal-700">{message}</p> : null}
      <div className="mt-6 grid gap-3 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        {settings.map((setting, index) => (
          <div key={`${setting.id}-${index}`} className="grid gap-3 rounded-md border border-slate-100 p-3 md:grid-cols-[1fr_2fr_160px]">
            <input value={setting.key} onChange={(event) => setSettings((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, key: event.target.value } : item))} placeholder="key" className="h-10 rounded-md border border-slate-300 px-3" />
            <div className="grid gap-2">
              <input value={setting.value ?? ""} onChange={(event) => setSettings((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, value: event.target.value } : item))} placeholder="value" className="h-10 rounded-md border border-slate-300 px-3" />
              {isImageSetting(setting.key) ? (
                <AdminImageUpload
                  value={setting.value ?? ""}
                  directory="settings"
                  onChange={(value) => setSettings((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, value } : item))}
                />
              ) : null}
            </div>
            <select value={setting.type} onChange={(event) => setSettings((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, type: event.target.value as Setting["type"] } : item))} className="h-10 rounded-md border border-slate-300 px-3">
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="json">JSON</option>
            </select>
          </div>
        ))}
        <button type="button" onClick={save} className="rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
          Luu cau hinh
        </button>
      </div>
    </main>
  );
}

function isImageSetting(key: string): boolean {
  return ['logo', 'favicon', 'og_image', 'website_logo'].includes(key);
}
