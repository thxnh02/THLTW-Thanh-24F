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
- Admin brand create/update/delete and delete guard
- Admin product create/update/delete, SKU/default variant persistence and sale price validation
- Admin promotion create/update/list/delete, validation and delete guard
- Admin user create/update/search/delete, locked login rejection and self-lock/delete guard
- Admin content/settings CRUD
- Admin stock import/export and negative stock prevention
- Admin image upload/list/delete validation and public disk storage
