# ============================================================
# Stage 1 - Build Vite/React frontend
# ============================================================
FROM node:20-alpine AS node-builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY vite.config.js ./
COPY resources ./resources
COPY public ./public

# Reverb / broadcast vars must be baked into the JS bundle at build time.
# Pass them as Docker build args in Railway → Variables → Build Variables.
ARG VITE_REVERB_APP_KEY=""
ARG VITE_REVERB_HOST=""
ARG VITE_REVERB_PORT="443"
ARG VITE_REVERB_SCHEME="https"
ARG VITE_APP_URL=""

ENV VITE_REVERB_APP_KEY=$VITE_REVERB_APP_KEY \
    VITE_REVERB_HOST=$VITE_REVERB_HOST \
    VITE_REVERB_PORT=$VITE_REVERB_PORT \
    VITE_REVERB_SCHEME=$VITE_REVERB_SCHEME \
    VITE_APP_URL=$VITE_APP_URL

RUN npm run build

# ============================================================
# Stage 2 - Install PHP/Composer dependencies
# ============================================================
FROM composer:2 AS composer-builder
WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-scripts \
    --no-autoloader \
    --prefer-dist \
    --ignore-platform-reqs

COPY . .
RUN composer dump-autoload --optimize --no-dev

# ============================================================
# Stage 3 - Production image (Nginx + PHP-FPM + Supervisor)
# ============================================================
FROM php:8.3-fpm-alpine AS production

# System packages
RUN apk add --no-cache \
    nginx \
    supervisor \
    ffmpeg \
    gettext \
    libpng-dev \
    libjpeg-turbo-dev \
    libwebp-dev \
    freetype-dev \
    libzip-dev \
    oniguruma-dev \
    libxml2-dev \
    curl-dev \
    mysql-client

# PHP extensions
RUN docker-php-ext-configure gd \
        --with-freetype \
        --with-jpeg \
        --with-webp \
    && docker-php-ext-install -j$(nproc) \
        pdo \
        pdo_mysql \
        mbstring \
        xml \
        curl \
        zip \
        gd \
        bcmath \
        opcache \
        pcntl \
        exif

WORKDIR /var/www/html

# Laravel app (from composer stage — includes vendor/)
COPY --from=composer-builder /app /var/www/html

# Built Vite assets (from node stage)
COPY --from=node-builder /app/public/build /var/www/html/public/build

# Docker config files
COPY docker/php.ini          /usr/local/etc/php/conf.d/app.ini
COPY docker/nginx.conf       /etc/nginx/nginx.conf.template
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/start.sh         /start.sh
RUN chmod +x /start.sh

# Storage / cache directories and permissions
RUN mkdir -p \
        storage/framework/sessions \
        storage/framework/views \
        storage/framework/cache \
        storage/logs \
        bootstrap/cache \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 775 storage bootstrap/cache

# Fallback .env so artisan doesn't crash before Railway injects vars
RUN test -f .env || (test -f .env.example && cp .env.example .env || echo "APP_KEY=" > .env)

EXPOSE 8080

CMD ["/start.sh"]
