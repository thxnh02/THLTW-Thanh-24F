"use client";
import { EntityCreatePage } from "@/components/admin/EntityEditorPage"; import { postCategoryFields } from "@/components/admin/entityConfigs";
export default function Page() { return <EntityCreatePage endpoint="/admin/post-categories" fields={postCategoryFields} title="Tao chuyen muc" backUrl="/admin/post-categories" submitLabel="Luu chuyen muc" />; }
