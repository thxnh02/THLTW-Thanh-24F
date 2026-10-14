# Category, Brand, and Product CRUD/Trash Design

## Goal and constraints

Complete the existing CT_24F coursework catalog, not the older feature-rich ecommerce project. Each of Category, Brand, and Product will support server-paginated admin list/create/read/update/soft-delete, a paginated trash, restore, and guarded permanent deletion. Keep the current public shop routes and Laravel/Next/Axios teaching architecture. Work only in the nested `CT_24F/` project on Git branch `CT_24F`; preserve all files and data outside it.

Out of scope: authentication, cart, checkout, orders, payments, inventory, variants, reviews, wishlist, marketing, and file/media upload. Admin endpoints remain unauthenticated for trusted local coursework only and must be documented as unsafe for public deployment.

## Existing baseline

The target branch is `CT_24F` at `8b6ff6c` and is clean. The active IDE checkout is `NguyenChiThanh`, so implementation will use an isolated worktree of the target branch. The nested project has Laravel API resources for categories/brands and public products; admin product currently supports create only. No table has `deleted_at`. The Next app is JavaScript/JSX with Next 16, React 19, Tailwind 4, Axios, `jsconfig.json`, and one JavaScript Next config. The nested app has no Lucide, Motion, or shadcn setup. Existing migrations and the Laragon scripts are already forward-migration oriented, but the seeder uses `updateOrCreate` and can overwrite edited demo data.

## Options considered

1. Build every backend endpoint first and then all frontend screens. This maximizes API consistency but postpones end-to-end feedback.
2. Complete one entity at a time. This makes each slice demonstrable but repeats decisions about lifecycle safety and UI patterns.
3. Establish shared persistence/API rules, then complete and validate each entity as a vertical slice, followed by shared UI/docs cleanup. **Selected:** it shares the safety-critical foundation while surfacing integration problems per module.

## Data and API design

- Add new, reversible migrations for nullable `deleted_at` on categories, brands, and products. Do not edit applied migrations or reset/drop tables. Add Eloquent `SoftDeletes`; ordinary queries exclude trashed rows, and trash actions use `onlyTrashed()`.
- Keep existing unique slug indexes. Slugs remain reserved while trashed; permanent deletion releases them. Update validation ignores only the current record, not other trashed records.
- Use FormRequest → controller → Resource → route for normal API CRUD. Keep the existing plural `/api/admin/{categories,brands,products}` endpoints; use Laravel resource routes for CRUD. Register `/trash` and `/trash/{id}` before dynamic resource routes. Restore is `POST /{id}/restore`; permanent deletion is `DELETE /{id}/force`.
- Regular admin lists include visible and hidden (`status` true/false) non-trashed records and paginate 10 per page. Trash lists contain only trashed records and paginate 10 per page. Public products remain 12 per page and require an active product, active category, and either no brand or an active brand.
- Keep existing response envelopes and paginator metadata. Admin resources may expose `deleted_at`/`status`; public resources stay lean and compatible.
- Add small admin options endpoints for all non-trashed categories and brands, returning flat `{id,name,parent_id}` / `{id,name}` choices. These are for selects only; list pages remain paginated. Category parent controls exclude self and descendants.

### Relationship safeguards

- A category can be soft-deleted only when it has no non-trashed products or children. Restoring a child requires a present, non-trashed parent. Permanent deletion checks all products and children with trashed rows included; it never nulls parent IDs or cascades history away.
- A brand can be soft-deleted only when no non-trashed product refers to it. Permanent deletion is blocked while any product, including a trashed product, references it.
- Product creation/update requires an existing non-trashed category and allows an optional existing non-trashed brand. Product restore is blocked if its category or linked brand is missing/trashed. Permanent deletion applies only to a trashed product.
- Category updates reject self-parenting and ancestor cycles. Relationship conflicts return `409` with a clear message; missing/wrong lifecycle state returns `404`; validation returns `422`.

## Frontend design

- Preserve public URLs `/`, `/categories`, `/brands`, `/products?page=N` and the existing API-config → Axios client → services → page data flow.
- Keep admin frontend paths singular. For each resource provide `/admin/{resource}`, `/create`, `/[id]/edit`, `/trash`, and `/[id]/restore`. Following the user's explicit interaction requirement, soft-delete and permanent-delete actions open an accessible confirmation dialog in the current list/trash view; do not navigate to a new delete page. API mutation happens only after a deliberate confirm click. Restore may keep its dedicated confirmation page.
- Add admin product list, edit, trash, restore, and a reusable `ProductForm`; provide soft-delete and permanent-delete confirmation dialogs in context. Forms show field-level 422 errors, loading/submission states, and preserve a user-entered slug. Product image is a URL/path string only, with graceful placeholder behavior; no upload manager.
- Fetch all option pages through services when lists provide paginated choices, so category/brand selects do not silently stop at page one. Prefer an options endpoint only for select data; never client-slice the admin lists.
- Use a restrained shared design: neutral white/slate shop with a blue/indigo accent; dark admin sidebar and light workspace; responsive tables scroll within their container; explicit status badges distinguish hidden from trashed. Use Lucide icons and restrained Motion with reduced-motion support. Avoid shadcn CLI initialization; implement small accessible local controls because this JS/Tailwind 4 app has no shadcn configuration and initialization risks overwriting current CSS.
- Admin desktop uses independently scrollable sidebar and workspace at viewport height. Mobile navigation is an accessible local drawer. Sidebar contains only Dashboard, Category, Brand, Product, and View Store. No invented metrics or unsupported product data.

## Tests, setup, and documentation

- Expand Laravel feature tests with isolated SQLite where feasible for normal CRUD, pagination, trashed slug uniqueness, each lifecycle, relation guards (including trashed dependents), category cycle prevention, product visibility, and 12-per-page public pagination.
- Run `php artisan test`, Pint if available, `npm run lint`, `npm run build`, and route/smoke checks. Never run destructive database reset commands against the existing MySQL database.
- Make seeding idempotent without overwriting existing user-edited records; preserve the current 14+ demo products. Review Laragon setup/start scripts for safe repeatability and no secret leakage. Keep the current single JS config setup unless audit finds a real duplicate inside nested `CT_24F/`.
- Update docs with actual routes/methods, soft-delete/slug/dependency semantics, setup, and the local-only admin security warning. Keep CI scoped to the nested project and do not introduce unrelated modules.

## Implementation sequence

1. Add soft-delete migrations, traits, and resource behavior; add tests for lifecycle semantics.
2. Complete Category and Brand routes/controllers/validation with relationship guards and category-cycle validation.
3. Complete Product CRUD/trash and public visibility rules; verify all backend tests.
4. Extend API config/services and option loading across all pages.
5. Add category/brand/product admin lifecycle pages and shared form/list states, with inline confirmation dialogs for destructive actions as explicitly requested by the user.
6. Refine shop/admin responsive visual system, accessible navigation, and independent admin scrolling.
7. Correct seeder/setup/docs/CI only where audit confirms a gap; verify migrations preserve data.
8. Run tests, lint/build, route checks, and a manual responsive lifecycle smoke pass; review diff and commit/push only to `CT_24F`.

## Acceptance criteria

- Category, Brand, and Product each complete the full server-backed lifecycle with dedicated pages and pagination.
- Existing rows survive forward migrations; soft delete does not erase relationships; permanent delete is guarded.
- Public product API stays 12 per page, excludes unavailable records/relations, and retains its current response shape.
- Admin selectors work for more records than one page. Hidden is not mislabeled as trashed.
- The shop/admin remain JS/JSX and Axios-based, responsive, accessible, and limited to the course scope.
- Required Laravel tests, frontend lint, and frontend build pass. Git changes are confined to nested `CT_24F/` and branch `CT_24F`; no force push or merge.
