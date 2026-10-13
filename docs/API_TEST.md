# API testing notes

Start Laravel, use the base URL `http://127.0.0.1:8000/api`, and send this header for every request:

```text
Accept: application/json
Content-Type: application/json
```

## Public requests

- `GET /categories` — active root categories with active `children`
- `GET /categories/dien-tu` — one active category; an unknown slug returns `404`
- `GET /brands` — active brands
- `GET /products` — active products, `data`, `links`, and `meta`; 12 records per page
- `GET /products?page=2` — the second product page

## Admin category

`GET /admin/categories?page=1` returns a backend paginator (10 per page).

`POST /admin/categories` body:

```json
{
  "name": "Âm thanh",
  "slug": "am-thanh",
  "parent_id": null,
  "description": "Dữ liệu để học CRUD",
  "image": null,
  "sort_order": 3,
  "status": true
}
```

Use `GET /admin/categories/{id}`, then `PUT /admin/categories/{id}` with the same body. `DELETE /admin/categories/{id}` returns `409` if it has products or child categories.

## Admin brand

`GET /admin/brands?page=1` returns a backend paginator (10 per page).

`POST /admin/brands` body:

```json
{
  "name": "Demo Brand",
  "slug": "demo-brand",
  "logo": null,
  "description": "Dữ liệu để học CRUD",
  "sort_order": 4,
  "status": true
}
```

Use `GET /admin/brands/{id}`, then `PUT /admin/brands/{id}` with the same body. `DELETE /admin/brands/{id}` returns `409` while products reference that brand.

Expected statuses: `200` successful reads/updates/deletes, `201` creation, `404` missing public category or admin record, `422` validation failure, and `409` deletion blocked by related data.
