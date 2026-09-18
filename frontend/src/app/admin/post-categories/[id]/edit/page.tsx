"use client";
import { EntityEditorPage } from "@/components/admin/EntityEditorPage"; import { postCategoryFields } from "@/components/admin/entityConfigs";
export default function Page() { return <EntityEditorPage endpoint="/admin/post-categories" fields={postCategoryFields} title="Sua chuyen muc" backUrl="/admin/post-categories" submitLabel="Luu thay doi" />; }
