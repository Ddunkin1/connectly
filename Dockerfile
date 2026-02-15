# Production Dockerfile for Laravel API (e.g. Railway).
# Railway runs this instead of Nixpacks when Dockerfile is present.
# Laravel is served with php artisan serve so /api/* routes work.

FROM php:8.2-cli

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    unzip \
    libzip-dev \
    libpng-dev \
    libonig-dev \
    && docker-php-ext-install zip pdo_mysql mbstring exif pcntl bcmath gd \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Install PHP deps first (better layer cache)
COPY composer.json composer.lock /app/
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

# Copy app (excluding dev assets)
COPY . /app

# Finish composer (autoload, etc.)
RUN composer dump-autoload --optimize

# .env must exist; Railway injects real vars at runtime
RUN test -f .env || cp .env.example .env

# Optional: cache config/routes at runtime via start script if you want
EXPOSE 8000

# Railway sets PORT; default 8000 for local docker run
CMD ["sh", "-c", "php artisan config:clear && php artisan serve --host=0.0.0.0 --port=${PORT:-8000}"]
