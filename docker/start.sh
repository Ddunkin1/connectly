#!/bin/sh
set -e

cd /var/www/html

# Railway provides $PORT dynamically; default 8080 for local docker run
APP_PORT="${PORT:-8080}"

echo "==> Configuring Nginx on port $APP_PORT"
sed "s/RAILWAY_PORT/$APP_PORT/g" /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

echo "==> Running database migrations"
php artisan migrate --force

echo "==> Creating storage symlink"
php artisan storage:link 2>/dev/null || true

echo "==> Caching config, routes, and views"
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "==> Starting services (Nginx + PHP-FPM + Queue)"
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
