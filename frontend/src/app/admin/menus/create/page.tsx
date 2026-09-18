"use client";
import { EntityCreatePage } from "@/components/admin/EntityEditorPage"; import { menuFields } from "@/components/admin/entityConfigs";
export default function Page() { return <EntityCreatePage endpoint="/admin/menus" fields={menuFields} title="Tao menu" backUrl="/admin/menus" submitLabel="Luu menu" />; }
