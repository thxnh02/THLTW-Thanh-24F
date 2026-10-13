"use client";
import { EntityCreatePage } from "@/components/admin/entity/EntityEditorPage"; import { menuFields } from "@/components/admin/entity/entityConfigs";
export default function Page() { return <EntityCreatePage endpoint="/admin/menus" fields={menuFields} title="Tạo menu" backUrl="/admin/menus" submitLabel="Lưu menu" />; }
