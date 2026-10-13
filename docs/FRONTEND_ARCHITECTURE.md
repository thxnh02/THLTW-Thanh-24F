# Frontend Architecture

The frontend keeps Next.js route groups for the public shop and the separate admin workspace. URLs are unchanged.

## Request flow

`Page or Context -> domain service -> services/transport -> Axios client -> Laravel API`

- `src/config/api.ts` centralizes the real Laravel API base URL and endpoints.
- `src/lib/axiosClient.ts` is the shared Axios client. It sends cookies, reads the `XSRF-TOKEN` cookie, and obtains `/sanctum/csrf-cookie` once before unsafe requests.
- `src/services/` contains shop services and `services/admin/` contains grouped admin services. `services/http.ts` is a typed compatibility facade used while generic CRUD pages share the same request behavior.
- `services/admin/adminTransport.ts` sends admin service requests through the explicitly named `axiosAdminClient`, while retaining the same Sanctum session and CSRF contract.
- `src/context/` contains React state providers only. Auth, cart quote, and public store settings delegate HTTP work to services.
- `src/store/guestCartStorage.ts` owns the `thltw_guest_cart_v1` localStorage format. It does not store authentication tokens.
- `src/utils/` contains generic formatting and slug utilities; `src/helper/orderStatus.ts` holds order display helpers; `src/data/` contains only static display data.

Authentication remains Laravel Sanctum cookie/session based. There is no Bearer token, auth token localStorage, Redux, or Zustand.

`components/common` is intentionally omitted: current feature-level components belong clearly to shop, admin, auth, or ui, and adding an empty shared folder would not improve ownership.

## Admin workspace

- `AdminShell` composes the authenticated workspace only. It owns the role guard, mobile drawer state, and the independent sidebar/main scroll regions.
- `AdminHeader` owns the top bar and account actions; `AdminSidebar` owns permission-filtered navigation; `data/adminNavigation.ts` is the single navigation definition.
- `components/admin/table/AdminTable.tsx` is a presentational semantic table shell used by the primary products, categories, brands, orders, users, and promotions lists. Pages retain fetching, filters, pagination, and domain actions.

## Category and brand coursework flow

`/admin/categories` and `/admin/brands` use Laravel pagination metadata directly. Their create and edit forms call `categoryAdminService` or `brandAdminService`, which use `API_CONFIG.ENDPOINTS.ADMIN` and the admin Axios transport. Both lists expose loading, empty, API-error, status, image/logo, edit, delete, and backend-paginated states. Deleting the final result on a later page navigates to the preceding valid page.
