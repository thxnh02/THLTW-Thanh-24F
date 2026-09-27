"use client";
import { EntityEditorPage } from "@/components/admin/EntityEditorPage"; import { pageFields } from "@/components/admin/entityConfigs";
export default function Page() { return <EntityEditorPage endpoint="/admin/pages" fields={pageFields} title="Sửa trang" backUrl="/admin/pages" submitLabel="Lưu thay đổi" />; }
