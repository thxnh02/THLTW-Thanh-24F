# Setup

## Backend

```powershell
cd backend
composer install
copy .env.example .env
php artisan key:generate
```

Configure database in `backend/.env`. For MySQL:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=thltw_shop
DB_USERNAME=root
DB_PASSWORD=
```

Then run:

```powershell
php artisan migrate --seed
php artisan storage:link
php artisan serve --host=localhost
```

## Frontend

```powershell
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

`frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## VNPay Sandbox

COD works without extra credentials. To test VNPay, configure these in `backend/.env`:

```env
VNP_TMN_CODE=
VNP_HASH_SECRET=
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURN_URL=http://localhost:8000/api/v1/vnpay/return
VNP_IPN_URL=http://localhost:8000/api/v1/vnpay/ipn
```
