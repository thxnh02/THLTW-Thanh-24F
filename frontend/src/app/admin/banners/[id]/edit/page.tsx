"use client";
import { EntityEditorPage } from "@/components/admin/EntityEditorPage"; import { bannerFields } from "@/components/admin/entityConfigs";
export default function Page() { return <EntityEditorPage endpoint="/admin/banners" fields={bannerFields} title="Sửa banner" backUrl="/admin/banners" submitLabel="Lưu thay đổi" />; }
