# Testing

Backend:

```powershell
cd backend
php artisan test
php artisan route:list --path=api --except-vendor
vendor/bin/pint --dirty --format agent
```

Frontend:

```powershell
cd frontend
npm run lint
npx tsc --noEmit
npm run build
```

Current focused tests cover:

- Register, login and locked account login rejection
- Sanctum SPA session login/logout behavior and frontend password reset URL generation
- Admin dashboard access: guest/member blocked, admin allowed
- Product catalog search/filter/sort/pagination shape
- Member cart add/update/remove and guest cart merge cap by stock
- Checkout creates order, decrements stock and writes inventory movement
- Checkout rejects quantity over stock
- Authenticated checkout attaches the order to the member account
- Checkout records promotion usage and blocks repeat use beyond per-customer limit
- VNPay checkout URL creation and signed callback verification
- Member order detail and pending cancel with one-time stock restore
- Member address book, wishlist and purchase-gated review rules
- Admin order list/search, valid status transition, invalid transition rejection
- Admin order cancel stock restore once
- Order confirmation email after checkout
- Member/admin invoice authorization
- Admin product/order CSV export
- Admin brand create/update/delete and delete guard
- Admin product create/update/delete, SKU/default variant persistence and sale price validation
- Admin promotion create/update/list/delete, validation and delete guard
- Admin user create/update/search/delete, locked login rejection and self-lock/delete guard
- Admin content/settings CRUD
- Admin stock import/export and negative stock prevention
- Admin image upload/list/delete validation and public disk storage

The current suite contains 58 tests with 261 assertions. The added completion tests cover shipping fee snapshots, return/refund stock safety, CSV import rollback, canceled-order report totals, manager/staff permissions, and notification privacy.

CI:

- `.github/workflows/ci.yml` runs Laravel tests and frontend lint/typecheck/build on push/PR.
# Added Verification Areas

- Shipping checkout: inactive/invalid methods rejected, free threshold applied, order snapshot preserved.
- Returns: completed-order eligibility, quantity limits, duplicate active returns, stock restore once.
- Import: valid CSV, duplicate SKU, unknown category/brand, sale price greater than price, update mode.
- Reports: canceled orders excluded from valid revenue and date ranges applied.
- Roles: member blocked from admin, manager/staff limited by backend permission checks.
