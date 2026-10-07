# Deployment

This project is prepared for a split deployment:

- Frontend: Vercel, with `frontend` as the root directory.
- Backend: a Docker Web Service such as Koyeb, with `backend` as the Docker context.
- Database: managed PostgreSQL such as Supabase.

## Backend service

Create a Web Service from the repository and set the root directory to `backend`. The included `Dockerfile` starts Apache with Laravel's `public` directory as the document root. The entrypoint runs migrations and caches configuration, routes and views before starting Apache.

Expose container port `80` as the public HTTP port in the service settings.

Required production variables:

```env
APP_NAME=THLTW Shop
APP_ENV=production
APP_KEY=<generate-a-new-production-key>
APP_DEBUG=false
APP_URL=https://<backend-domain>
FRONTEND_URL=https://<vercel-domain>
CORS_ALLOWED_ORIGINS=https://<vercel-domain>
SANCTUM_STATEFUL_DOMAINS=<vercel-domain>
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=none

DB_CONNECTION=pgsql
DB_HOST=<postgres-host>
DB_PORT=5432
DB_DATABASE=<postgres-database>
DB_USERNAME=<postgres-user>
DB_PASSWORD=<postgres-password>
DB_SSLMODE=require

FILESYSTEM_DISK=local
PUBLIC_FILESYSTEM_DISK=s3
MAIL_MAILER=smtp
MAIL_HOST=<smtp-host>
MAIL_PORT=587
MAIL_USERNAME=<smtp-user>
MAIL_PASSWORD=<smtp-password>
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=<verified-sender>
MAIL_FROM_NAME=THLTW Shop
```

Use an S3-compatible bucket for `PUBLIC_FILESYSTEM_DISK=s3`. If local storage is used, uploaded images will not be durable on ephemeral hosting. Configure `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION`, `AWS_BUCKET`, `AWS_URL` and `AWS_ENDPOINT` in the service dashboard when using an S3-compatible provider.

Set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` only when an initial admin is needed. Never use the development demo credentials in production.

## Vercel

Create a project from the repository with root directory `frontend`. Add:

```env
NEXT_PUBLIC_API_URL=https://<backend-domain>/api/v1
NEXT_PUBLIC_SITE_URL=https://<vercel-domain>
```

The backend CORS and Sanctum variables must contain the final Vercel domain, including the exact preview or custom domain used for testing.

## Release checklist

1. Rotate any SMTP app password that was exposed during local troubleshooting.
2. Create a fresh production `APP_KEY` and store secrets only in the hosting dashboards.
3. Create the PostgreSQL database and configure the backend variables.
4. Configure the object storage bucket before testing image uploads.
5. Push the release branch to GitHub, then deploy backend and frontend.
6. Register a test account, verify it with both the code and link, upload an image, place a COD order and open the admin area.
7. Confirm HTTPS cookies, CORS, mail delivery and image URLs from the deployed domains.
