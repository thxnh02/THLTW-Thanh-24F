# Category, Brand, and Product CRUD/Trash Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the server-backed CRUD and trash lifecycle for categories, brands, and products while preserving the CT_24F course architecture and existing MySQL data.

**Architecture:** Add forward-only Laravel soft-delete migrations and keep lifecycle rules in FormRequests/controllers/resources. Then add paginated API/service support and dedicated Next.js pages, sharing only simple form/action/table primitives. Finish with the premium responsive shop/admin polish, safe setup/docs cleanup, and full verification.

**Tech Stack:** Laravel 13, Eloquent, FormRequest, API Resources, PHPUnit/SQLite, Next.js 16, React 19, JavaScript/JSX, Tailwind CSS 4, Axios, Lucide, Motion.

**Spec:** `docs/superpowers/specs/2026-10-14-category-brand-product-trash-design.md`

## Global Constraints

- Work only in the nested `CT_24F/` project on Git branch `CT_24F`; preserve all files and data outside it.
- Do not edit applied migrations or reset/drop tables; add reversible soft-delete migrations only.
- Keep existing unique slug indexes; a slug remains unavailable while its record is trashed.
- Keep public routes `/`, `/categories`, `/brands`, `/products?page=N` and existing plural `/api` endpoints.
- Keep Laravel FormRequest → controller → Resource → route and frontend API config → Axios → service → page architecture.
- Keep JavaScript/JSX, `jsconfig.json`, Next 16, React 19, Tailwind 4, and avoid TypeScript migration.
- Keep admin frontend URLs singular and API paths plural; destructive actions require dedicated pages and explicit confirmation.
- No auth/cart/orders/payment/stock/variants/reviews/wishlist/media upload or other unrelated modules.
- Never commit `.env`, credentials, MySQL files, vendor, node_modules, or build output.
- Never run `migrate:fresh`, `db:wipe`, DROP/TRUNCATE, git reset/clean, rebase, merge, or force-push.
- Keep normal admin APIs open only for trusted local coursework; document that they are unsafe to expose publicly without authentication.
- Commit implementation work locally to `CT_24F`; push only after all verification and final review are green.

## Review Focus

- A trashed slug still collides with the database unique index; pin this to Store/Update validation tests in Tasks 2–4.
- Category ancestry can become cyclic through a multi-level edit, not just direct self-parenting; pin this to Task 2.
- A trashed child/product still blocks permanent deletion and a hidden (`status=false`) row is not trashed; pin lifecycle guards/status assertions to Tasks 2–4.
- Public products with hidden/trashed categories or brands must not leak while nullable brand remains valid; pin this to Task 4.
- Option controls must not stop at page 1 or include trashed rows/invalid parents; pin all-records options assertions to Tasks 2, 3, and 5.

---

### Task 1: Forward soft-delete schema and Eloquent behavior

**Files:**
- Create: `backend/database/migrations/2026_10_14_000004_add_soft_deletes_to_catalog_tables.php`
- Modify: `backend/app/Models/Category.php`, `Brand.php`, `Product.php`
- Modify: `backend/app/Http/Resources/CategoryResource.php`, `BrandResource.php`, `ProductResource.php`
- Test: `backend/tests/Feature/CatalogApiTest.php`

**Interfaces:**
- Produces: all three models use Laravel `SoftDeletes`; admin resource responses expose `deleted_at` while public resources omit admin-only fields.

- [x] **Step 1: Add failing model lifecycle tests** named `test_soft_deleted_category_brand_and_product_are_hidden_from_default_queries` and `test_admin_resources_include_deleted_at_without_changing_public_product_schema`. Assert normal queries exclude deleted rows, `onlyTrashed()` finds them, and existing public product fields remain unchanged.
- [x] **Step 2: Run the focused tests** with `cd backend; php artisan test --filter='soft_deleted|deleted_at'` and record the expected failure before implementation.
- [x] **Step 3: Add one reversible migration** calling `softDeletes()` on `categories`, `brands`, and `products`; rollback only drops those three added columns. Add the trait to each model and conditionally serialize admin-only lifecycle fields in Resources.
- [x] **Step 4: Run focused tests and migration checks** with `php artisan test --filter='soft_deleted|deleted_at'`; PHPUnit uses SQLite `:memory:`, so the full test run exercises migrations in isolation without rolling back the developer's MySQL database. Both lifecycle tests must pass.
- [x] **Step 5: Commit** as `Add catalog soft delete foundation`.

### Task 2: Category CRUD, trash API, and hierarchy safety

**Files:**
- Modify: `backend/routes/api.php`
- Modify: `backend/app/Http/Controllers/Api/Admin/AdminCategoryController.php`
- Modify: `backend/app/Http/Requests/StoreCategoryRequest.php`, `UpdateCategoryRequest.php`
- Test: `backend/tests/Feature/CatalogApiTest.php`

**Interfaces:**
- Consumes: Task 1 SoftDeletes and admin lifecycle Resource field.
- Produces: `index`, `store`, `show`, `update`, `destroy`, `trash`, `trashedShow`, `restore`, `forceDestroy`, and `options` for `/api/admin/categories`; regular/trash pages paginate 10; options return every non-trashed `{id,name,parent_id}` row.

- [ ] **Step 1: Add failing tests** named `test_admin_category_crud_and_options_exclude_trashed_parent_choices`, `test_category_soft_delete_checks_active_dependencies`, `test_category_trash_restore_and_force_delete_lifecycle`, and `test_category_restore_and_update_reject_invalid_parent_graph`. Assert hidden rows remain on the normal list, trashed slugs still return 422, active relations block soft delete with 409, trashed relations block force delete with 409, trashed rows 404 on normal show, restore requires a live parent, and multi-level cycles fail validation.
- [ ] **Step 2: Run those tests** with `cd backend; php artisan test --filter=category` and confirm they fail for missing lifecycle routes/rules.
- [ ] **Step 3: Implement Category endpoints** with static `GET /trash`, `GET /trash/{id}`, and `GET /options` registered before `apiResource`; add numeric route constraints and `POST /{id}/restore`, `DELETE /{id}/force`. Keep create/update FormRequests, validate non-trashed parents and globally unique slugs, reject ancestor cycles, soft-delete only without active products/children, and force-delete only with no products/children including trashed rows.
- [ ] **Step 4: Run category tests** with `php artisan test --filter=category`; all assertions above must pass with 200/201/404/409/422 as specified.
- [ ] **Step 5: Commit** as `Add category trash lifecycle and hierarchy guards`.

### Task 3: Brand CRUD and trash API

**Files:**
- Modify: `backend/routes/api.php`
- Modify: `backend/app/Http/Controllers/Api/Admin/AdminBrandController.php`
- Modify: `backend/app/Http/Requests/StoreBrandRequest.php`, `UpdateBrandRequest.php`
- Test: `backend/tests/Feature/CatalogApiTest.php`

**Interfaces:**
- Consumes: Task 1 SoftDeletes and Task 2 route/response conventions.
- Produces: complete `/api/admin/brands` resource lifecycle plus `trash`, `trashedShow`, `restore`, `forceDestroy`, and all-record `options` returning `{id,name}`.

- [ ] **Step 1: Add failing tests** named `test_admin_brand_crud_and_trash_lifecycle` and `test_brand_deletion_guards_include_trashed_products`. Cover normal/trashed detail separation, reserved trashed slugs, list pagination at 10, restore only from trash, 409 for soft-delete with an active product, and 409 for force-delete with any active or trashed product.
- [ ] **Step 2: Run** `cd backend; php artisan test --filter=brand` and confirm lifecycle tests fail before implementation.
- [ ] **Step 3: Implement Brand routes/controller/options** with static routes before `apiResource`; use onlyTrashed for trash actions, keep hidden brands in normal admin list, soft-delete only when no active products refer to them, and force-delete only when no product including trashed rows refers to them.
- [ ] **Step 4: Run** `php artisan test --filter=brand`; all lifecycle and dependency assertions must pass.
- [ ] **Step 5: Commit** as `Add brand trash lifecycle and dependency guards`.

### Task 4: Product admin CRUD/trash and public availability rules

**Files:**
- Create: `backend/app/Http/Requests/UpdateProductRequest.php`
- Create: `backend/app/Http/Controllers/Api/Admin/AdminProductController.php` lifecycle methods
- Modify: `backend/routes/api.php`, `backend/app/Http/Requests/StoreProductRequest.php`, `backend/app/Http/Controllers/Api/ProductController.php`, `backend/app/Http/Resources/ProductResource.php`
- Test: `backend/tests/Feature/CatalogApiTest.php`

**Interfaces:**
- Consumes: Task 1 model lifecycle and Tasks 2–3 route/options conventions.
- Produces: paginated admin product CRUD and lifecycle API under `/api/admin/products`; admin resources eager-load category/brand; public `/api/products` remains 12/page.

- [ ] **Step 1: Add failing tests** named `test_admin_product_crud_validation_and_slug_is_globally_unique`, `test_admin_product_trash_restore_and_force_delete_lifecycle`, `test_product_restore_requires_live_category_and_brand`, and `test_public_products_exclude_unavailable_relations_and_paginate_twelve`. Assert category required/live, optional brand must be live, decimal range/precision, update ignores only self, admin index includes status false but excludes trash, relation guards return correct status, public list is 12/page, hidden/trashed category or brand products are excluded, and nullable brand remains supported.
- [ ] **Step 2: Run** `cd backend; php artisan test --filter=product` and confirm new cases fail before implementation.
- [ ] **Step 3: Implement Product requests/controller/routes** using `StoreProductRequest` and `UpdateProductRequest`, standard Resource CRUD, trash endpoints before dynamic routes, `onlyTrashed()` lifecycle lookup, category/brand existence rules scoped to `deleted_at IS NULL`, and relationship-aware restore guards. Preserve schema fields only; do not clear FKs on delete.
- [ ] **Step 4: Implement public filtering** with `status=true`, active category, and either null brand or active brand; leave `paginate(12)` and public resource shape intact.
- [ ] **Step 5: Run** `php artisan test --filter=product`; all API lifecycle, validation, visibility, and pagination assertions must pass.
- [ ] **Step 6: Commit** as `Complete product admin CRUD and trash API`.

### Task 5: Frontend API configuration and complete option loading

**Files:**
- Modify: `frontend/src/config/api.js`
- Modify: `frontend/src/services/categoryServices.js`, `brandServices.js`, `productServices.js`
- Test: Laravel options assertions in `backend/tests/Feature/CatalogApiTest.php`; verify frontend via lint/build.

**Interfaces:**
- Consumes: Tasks 2–4 endpoint contracts.
- Produces: centralized endpoint constants for all public/admin CRUD/trash/restore/force operations; service methods for each action and all-record select options.

- [ ] **Step 1: Add/extend failing options assertions** to create more than 10 non-trashed categories/brands, then assert the options endpoints return all of them and none trashed.
- [ ] **Step 2: Run** `cd backend; php artisan test --filter=options` and confirm failures if an options endpoint or all-record response is missing.
- [ ] **Step 3: Implement service methods** `getAdminCategoryOptions()`, `getAdminBrandOptions()`, and Product methods `getAdminProducts`, `getAdminProduct`, `createProduct`, `updateProduct`, `deleteProduct`, `getProductTrash`, `getTrashedProduct`, `restoreProduct`, `forceDeleteProduct`; add matching Category/Brand lifecycle methods and endpoint constants. Page components must not call Axios directly.
- [ ] **Step 4: Run** backend option tests and `cd frontend; npm.cmd run lint`; all option results must exceed page size and lint must pass.
- [ ] **Step 5: Commit** as `Centralize catalog lifecycle API services`.

### Task 6: Shared accessible admin lifecycle primitives

**Files:**
- Create/modify: `frontend/src/components/admin/AdminTable.jsx`, `Header.jsx`, `SideBar.jsx`, `CategoryForm.jsx`, `BrandForm.jsx`, `ConfirmActionPage.jsx`, `TrashTable.jsx`, `StatusBadge.jsx`
- Create as needed: focused components under `frontend/src/components/ui/`
- Test: frontend lint/build and manual keyboard/mobile component smoke checks.

**Interfaces:**
- Consumes: Task 5 service contracts.
- Produces: reusable semantic table, form states, status badges, explicit confirmation page, and trash list shell; actions navigate to pages and never mutate from row click.

- [ ] **Step 1: Define component props** in code comments/exports: `AdminTable({columns,data,loading,error,emptyMessage,renderActions})`, `StatusBadge({status,deletedAt})`, `ConfirmActionPage({load,recordLabel,warning,submit,backHref,successHref})`, and `TrashTable({columns,data,meta,loading,error,renderActions})`.
- [ ] **Step 2: Implement semantic/accessibility behavior**: `scope="col"`, local overflow-x, 40–44px actions, visible focus, loading/empty/error, disabled submit, exact server message display, and accessible names for icon-only controls.
- [ ] **Step 3: Run** `cd frontend; npm.cmd run lint`; require zero lint errors.
- [ ] **Step 4: Commit** as `Add reusable accessible admin lifecycle components`.

### Task 7: Category and Brand dedicated CRUD/trash pages

**Files:**
- Modify: `frontend/src/app/admin/category/page.jsx`, `create/page.jsx`, `[id]/edit/page.jsx`
- Create: `frontend/src/app/admin/category/[id]/delete/page.jsx`, `trash/page.jsx`, `[id]/restore/page.jsx`, `[id]/force-delete/page.jsx`
- Modify: equivalent existing Brand list/create/edit pages
- Create: equivalent Brand delete/trash/restore/force-delete pages
- Modify: category/brand services only if Task 5 interfaces require it.

**Interfaces:**
- Consumes: Tasks 5–6.
- Produces: exact singular routes `/admin/category/...` and `/admin/brand/...`; category parent choices exclude self/descendants and include all pages; delete/restore/force pages show real record identity and only mutate on explicit confirmation.

- [ ] **Step 1: Refactor existing list actions** to link to `[id]/edit`, `[id]/delete`, and `/trash`; remove inline API deletion and `window.confirm`.
- [ ] **Step 2: Implement dedicated Category/Brand action pages** using the shared loader/confirmation UI; call trashed detail for restore/force, normal detail for soft delete, show 404/409 messages, then redirect to list/trash only after success.
- [ ] **Step 3: Implement paginated trash pages** using only backend page data, displaying deleted_at distinctly from status and linking to restore/force pages.
- [ ] **Step 4: Update create/edit forms** with complete category option loading, parent graph filtering, field-level 422 messages, and reliable back/cancel navigation.
- [ ] **Step 5: Run** `cd frontend; npm.cmd run lint; npm.cmd run build`; confirm all new routes appear and no static `/trash` route is swallowed by `[id]`.
- [ ] **Step 6: Commit** as `Add category and brand dedicated trash workflows`.

### Task 8: Product form and complete admin lifecycle pages

**Files:**
- Create: `frontend/src/components/admin/ProductForm.jsx`
- Modify: `frontend/src/app/admin/product/create/page.jsx`
- Create: `frontend/src/app/admin/product/page.jsx`, `[id]/edit/page.jsx`, `[id]/delete/page.jsx`, `trash/page.jsx`, `[id]/restore/page.jsx`, `[id]/force-delete/page.jsx`

**Interfaces:**
- Consumes: Tasks 5–7.
- Produces: exact `/admin/product/...` routes and a schema-aligned create/edit form with category/brand options, optional real image preview/fallback, validation, and no fake uploads.

- [ ] **Step 1: Implement ProductForm** with Basic Info, Classification, Pricing, and Visibility cards; load every non-trashed category/brand from Task 5; auto-suggest slug only while it remains untouched; use decimal input and server field errors.
- [ ] **Step 2: Wire create/edit** through `productServices`; prevent duplicate submission and preserve entered data when validation fails.
- [ ] **Step 3: Implement product list/trash** with server pagination (10), real image/name/category/brand/price/status/deleted_at values, skeleton/empty/error states, and dedicated action links.
- [ ] **Step 4: Implement delete/restore/force pages** with explicit confirmation and correct services/verbs; force-delete warning identifies the exact product and states permanence.
- [ ] **Step 5: Run** `cd frontend; npm.cmd run lint; npm.cmd run build`; ensure all seven Product URLs are generated and no route conflicts exist.
- [ ] **Step 6: Commit** as `Add complete product admin lifecycle pages`.

### Task 9: Shop/admin visual system and responsive navigation

**Files:**
- Modify: `frontend/package.json`, `package-lock.json`, `src/app/globals.css`, `src/app/(shop)/layout.js`, shop pages, `src/app/admin/layout.js`, `src/app/admin/page.jsx`, `src/components/admin/Header.jsx`, `SideBar.jsx`
- Create: accessible responsive drawer component if not kept inline.

**Interfaces:**
- Consumes: completed public/product and admin service/page interfaces from Tasks 5–8.
- Produces: restrained premium shop/admin styles, Lucide icon usage, reduced-motion-aware transitions, and independent desktop admin scrolling plus an accessible mobile drawer.

- [ ] **Step 1: Install only missing dependencies** `lucide-react` and `motion`; keep JS configs and avoid shadcn CLI setup.
- [ ] **Step 2: Refine public pages** around actual API data only; preserve exact public URLs and 12/page; ensure null/invalid image uses neutral placeholder and no fabricated reviews/ratings/sales.
- [ ] **Step 3: Refine admin shell** with fixed `h-dvh overflow-hidden`, independently scrolling sidebar/workspace, current section header, and sidebar links limited to Dashboard/Category/Brand/Product/View Store.
- [ ] **Step 4: Add mobile navigation** with focusable controls, close-on-navigation, Escape/outside dismissal, `aria-expanded`/label, and reduced-motion support; respect 360px and 390px widths.
- [ ] **Step 5: Run** `cd frontend; npm.cmd run lint; npm.cmd run build`; verify no layout overflow at 360/390/768/1024/1280px manually.
- [ ] **Step 6: Commit** as `Polish responsive shop and admin experience`.

### Task 10: Seeder, Laragon scripts, CI, and course documentation

**Files:**
- Modify if audit confirms needed: `backend/database/seeders/DatabaseSeeder.php`, `setup-mysql.bat`, `start-dev.bat`, `.github/workflows/ci.yml`, root/backend/frontend READMEs, `docs/API_TEST.md`, `docs/DATABASE.md`, `docs/FRONTEND_ARCHITECTURE.md`

**Interfaces:**
- Consumes: final routes, fields, and migration behavior from Tasks 1–9.
- Produces: repeatable demo seeding without overwriting edited records; safe Laragon setup that never resets data or commits secrets; accurate lifecycle/API/security documentation; CI paths covering nested CT_24F.

- [ ] **Step 1: Add seeder regression assertions** to `test_demo_seeder_is_idempotent_and_preserves_edited_demo_records`; assert repeated seed preserves a changed name/price while keeping at least 14 stable demo products.
- [ ] **Step 2: Run** `cd backend; php artisan test --filter=demo_seeder` and confirm the preservation assertion fails with current `updateOrCreate` behavior.
- [ ] **Step 3: Use stable `firstOrCreate` keys** for demo categories/brands/products; preserve foreign-key IDs and do not overwrite existing rows.
- [ ] **Step 4: Review and minimally correct setup scripts**: keep `ecommerce_thltw`, Laravel `/api`, ports 8000/3000, safe `migrate` only; never rewrite an existing secret-bearing `.env`, never run reset commands, and clearly require Laragon Start All.
- [ ] **Step 5: Update docs/CI** with route methods, global trashed-slug uniqueness, relation guards, local-only admin warning, and workflows triggered by nested `CT_24F/**` changes; do not delete configs without an actual duplicate in this subtree.
- [ ] **Step 6: Run** seeder test, `php artisan test`, and inspect scripts for `migrate:fresh`, `db:wipe`, DROP/TRUNCATE, or committed `.env`; expected: none.
- [ ] **Step 7: Commit** as `Harden CT_24F setup and document catalog lifecycle`.

### Task 11: Integrated verification and final Git handoff

**Files:**
- Review all changes under nested `CT_24F/`; no unrelated paths.

**Interfaces:**
- Consumes: Tasks 1–10.
- Produces: verified branch `CT_24F`, a clean working tree, and a normal push to `origin/CT_24F` only.

- [ ] **Step 1: Run Laravel validation** with `cd backend; php artisan test`; all feature tests pass on the isolated SQLite configuration. Run Pint only if installed, without applying unrelated formatting.
- [ ] **Step 2: Run frontend validation** with `cd frontend; npm.cmd run lint` and `npm.cmd run build`; both exit 0.
- [ ] **Step 3: Run route verification** with `php artisan route:list --path=api/admin`; verify static `/trash` routes precede dynamic IDs and correct GET/POST/DELETE methods are present.
- [ ] **Step 4: Smoke the full lifecycle** for each resource on desktop/mobile: create, list, edit, soft-delete confirmation/cancel/confirm, trash, restore, force-delete confirmation, relation-blocked 409, and public visibility/pagination.
- [ ] **Step 5: Review Git diff/status**; require only `CT_24F/` paths, no `.env`, vendor, node_modules, caches, or DB data; verify branch is `CT_24F` and do not merge or force-push.
- [ ] **Step 6: Commit final fixes** as `Verify complete CT_24F catalog lifecycle` only if the review produced any changes; otherwise do not create an empty commit.
- [ ] **Step 7: Push once all checks are green** with `git push origin CT_24F`; verify remote HEAD and clean status, then report commit SHA and link.
