"use client";
import { EntityEditorPage } from "@/components/admin/EntityEditorPage"; import { bannerFields } from "@/components/admin/entityConfigs";
export default function Page() { return <EntityEditorPage endpoint="/admin/banners" fields={bannerFields} title="Sua banner" backUrl="/admin/banners" submitLabel="Luu thay doi" />; }
