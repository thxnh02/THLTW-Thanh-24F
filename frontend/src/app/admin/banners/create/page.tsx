"use client";
import { EntityCreatePage } from "@/components/admin/EntityEditorPage"; import { bannerFields } from "@/components/admin/entityConfigs";
export default function Page() { return <EntityCreatePage endpoint="/admin/banners" fields={bannerFields} title="Tạo banner" backUrl="/admin/banners" submitLabel="Lưu banner" />; }
