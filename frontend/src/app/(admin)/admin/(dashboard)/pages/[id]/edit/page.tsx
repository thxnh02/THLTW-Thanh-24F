"use client";
import { EntityEditorPage } from "@/components/admin/entity/EntityEditorPage"; import { pageFields } from "@/components/admin/entity/entityConfigs";
export default function Page() { return <EntityEditorPage endpoint="/admin/pages" fields={pageFields} title="Sửa trang" backUrl="/admin/pages" submitLabel="Lưu thay đổi" />; }
