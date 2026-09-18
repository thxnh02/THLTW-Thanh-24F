"use client";
import { EntityEditorPage } from "@/components/admin/EntityEditorPage"; import { menuFields } from "@/components/admin/entityConfigs";
export default function Page() { return <EntityEditorPage endpoint="/admin/menus" fields={menuFields} title="Sua menu" backUrl="/admin/menus" submitLabel="Luu thay doi" />; }
