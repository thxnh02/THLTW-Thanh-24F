# Backend Architecture

The backend is a Laravel 13 API under \`backend/\`, exposed through versioned
\`/api/v1\` routes. The frontend is a Next.js application under \`frontend/\`
and consumes the existing response envelope:

    {
      "success": true,
      "message": "OK",
      "data": {},
      "meta": {}
    }

## Request Flow

The default request flow is:

    Route -> FormRequest -> Controller -> Resource/response -> JSON

- Routes define authentication, account status and admin permission boundaries.
- Form Requests own input validation and normalization such as generated slugs
  and promotion code normalization.
- Controllers coordinate authorization, model lookup and the response.
- Resources explicitly expose API fields and prevent accidental model leakage.
- Existing pagination and product payload shapes remain compatible with the
  frontend contract.

## Services

Services are used for workflows that contain transactions, locking, external
side effects or multiple models:

- \`CheckoutService\` owns order creation, quote validation, stock locking,
  inventory movements, promotion usage and payment URL generation.
- \`OrderStatusService\` owns admin status transitions, member cancellation,
  order history and one-time stock restoration.
- \`ProductImportService\` owns CSV preview/import behavior.
- \`ReturnService\` owns customer and admin return workflows.
- \`ShippingService\` owns shipping quote and method behavior.

Controllers remain responsible for HTTP concerns such as status codes,
permission checks and mail/notification dispatch.

## Data Safety

- Checkout and stock changes run inside database transactions.
- Product variants are locked before stock is changed.
- Order cancellation restores stock only once.
- Idempotency keys prevent duplicate checkout orders.
- User resources never expose passwords or remember tokens.
- Public file storage is configurable through \`PUBLIC_FILESYSTEM_DISK\`.

## Performance Rules

List and detail queries should eager-load relationships used by the response
and use \`withCount\`/\`withAvg\` for aggregates. Paginated responses must
preserve the current \`data.data\` shape consumed by the frontend. New
relationships should be added to query eager-loading rather than loaded from
inside loops.

## Authentication

The application keeps Sanctum cookie/session authentication for the browser
flow. Account routes use \`auth:sanctum\` and \`EnsureAccountActive\`; admin
routes add \`EnsureAdmin\` and permission checks. Email verification supports
both a signed link and a six-digit code.

## Testing

Run backend checks from \`backend/\`:

    vendor/bin/pint --dirty --format agent
    php artisan test
    php artisan route:list --path=api

Run frontend checks from \`frontend/\`:

    npm run lint
    npx tsc --noEmit
    npm run build
