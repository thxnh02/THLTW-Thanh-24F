#!/usr/bin/env sh
set -e

cd /var/www/html

php artisan migrate --force --no-interaction
php artisan config:cache
php artisan route:cache
php artisan view:cache

if [ "${PUBLIC_FILESYSTEM_DISK:-public}" = "public" ]; then
    php artisan storage:link --quiet || true
fi

exec "$@"
