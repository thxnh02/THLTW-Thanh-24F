"use client";
import { EntityEditorPage } from "@/components/admin/EntityEditorPage"; import { pageFields } from "@/components/admin/entityConfigs";
export default function Page() { return <EntityEditorPage endpoint="/admin/pages" fields={pageFields} title="Sua trang" backUrl="/admin/pages" submitLabel="Luu thay doi" />; }
