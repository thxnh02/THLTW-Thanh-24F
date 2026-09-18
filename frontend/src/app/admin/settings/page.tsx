"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AdminImageUpload } from "@/components/AdminImageUpload";
import { ApiError, apiGet, apiPut } from "@/lib/api";
import type { Setting } from "@/types/api";
import { Button, Input, Select } from "@/components/ui";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

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
    setSaving(true);
    try {
      await apiPut("/admin/settings", { settings });
      setMessage("Đã lưu cấu hình.");
      load();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Không thể lưu cấu hình.");
    } finally {
      setSaving(false);
    }
  }

  function addSetting() {
    setSettings((current) => [...current, { id: Date.now(), key: "", value: "", type: "string" }]);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-slate-950">Cấu hình cửa hàng</h1>
        <Button type="button" variant="secondary" onClick={addSetting}>Thêm trường</Button>
      </div>
      {message ? <p className="mt-3 text-sm text-teal-700">{message}</p> : null}
      <div className="mt-6 grid gap-3 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        {settings.map((setting, index) => (
          <div key={`${setting.id}-${index}`} className="grid gap-3 rounded-md border border-slate-100 p-3 md:grid-cols-[1fr_2fr_160px]">
            <Input value={setting.key} onChange={(event) => setSettings((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, key: event.target.value } : item))} placeholder="Khóa cấu hình" />
            <div className="grid gap-2">
              <Input value={setting.value ?? ""} onChange={(event) => setSettings((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, value: event.target.value } : item))} placeholder="Giá trị" />
              {isImageSetting(setting.key) ? (
                <AdminImageUpload
                  value={setting.value ?? ""}
                  directory="settings"
                  onChange={(value) => setSettings((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, value } : item))}
                />
              ) : null}
            </div>
            <Select value={setting.type} onChange={(event) => setSettings((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, type: event.target.value as Setting["type"] } : item))} className="h-10">
              <option value="string">Văn bản</option><option value="number">Số</option><option value="boolean">Đúng/Sai</option><option value="json">JSON</option>
            </Select>
          </div>
        ))}
        <Button type="button" onClick={() => void save()} disabled={saving}>{saving ? "Đang lưu..." : "Lưu cấu hình"}</Button>
      </div>
    </main>
  );
}

function isImageSetting(key: string): boolean {
  return ['logo', 'favicon', 'og_image', 'website_logo'].includes(key);
}
