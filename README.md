# Connectly

A social media application built with Laravel and React, featuring posts, comments, communities, messaging, and real-time notifications.

## Tech Stack

- **Backend:** Laravel 12, PHP 8.5
- **Frontend:** React 18, Vite, Tailwind CSS
- **Database:** MySQL 8.4
- **Auth:** Laravel Sanctum
- **Real-time:** Laravel Reverb, Echo
- **Dev environment:** Laravel Sail (Docker)
- **Database GUI:** Navicat

## Quick Start

```bash
cp .env.example .env
./vendor/bin/sail up -d
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan migrate
npm install && npm run build
```

Open http://localhost in your browser.

## Documentation

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** — Full setup and implementation guide
- **[NAVICAT_LINUX_GUIDE.md](NAVICAT_LINUX_GUIDE.md)** — Using Navicat on Linux with Laravel Sail

## Project Structure

- `app/` — Models, Controllers, Services, Policies, Events
- `resources/js/` — React SPA (components, pages, hooks, store)
- `routes/api.php` — REST API routes
- `database/migrations/` — Database schema
- `compose.yaml` — Sail services (MySQL, app, reverb, queue)

## License

MIT
