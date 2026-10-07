"use client";
import { EntityEditorPage } from "@/components/admin/entity/EntityEditorPage"; import { menuFields } from "@/components/admin/entity/entityConfigs";
export default function Page() { return <EntityEditorPage endpoint="/admin/menus" fields={menuFields} title="Sửa menu" backUrl="/admin/menus" submitLabel="Lưu thay đổi" />; }
