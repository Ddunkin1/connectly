# Connectly

A social media application built with Laravel and React, featuring posts, comments, communities, messaging, and real-time notifications.

## Tech Stack

- **Backend:** Laravel 12, PHP 8.5
- **Frontend:** React 18, Vite, Tailwind CSS
- **Database:** MySQL 8.4 (all app data: users, posts, sessions, etc.) — connect with **Navicat**
- **Media storage:** Supabase Storage only (pictures, videos: profile/cover images, post media, message attachments, stories)
- **Auth:** Laravel Sanctum
- **Real-time:** Laravel Reverb, Echo
- **Dev environment:** Laravel Sail (Docker) — **the whole project runs in Sail**
- **Database GUI:** Navicat (same MySQL as Laravel; use host `127.0.0.1`, port `3306`, database `connectly_app`)

## Quick Start

The project is intended to run entirely via Laravel Sail. From the project root:

```bash
cp .env.example .env
./vendor/bin/sail up
```

In another terminal (or after pressing `Ctrl+C` if you ran `sail up` in the foreground):

```bash
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan migrate
npm install && npm run build
```

Then open http://localhost in your browser. To run Sail in the background instead, use `./vendor/bin/sail up -d`.

**If you get a container name conflict** (e.g. "container name already in use" or "No such container"), run a clean start:

```bash
./sail-up-fresh
```

This stops Sail, removes any leftover `connectly-*` containers, and runs `sail up` again.

## Data architecture

- **MySQL (Navicat):** All application data lives here — users, posts, sessions, messages, notifications, etc. Connect Navicat to the same MySQL (host `127.0.0.1`, port `3306`, database `connectly_app` when using Sail).
- **Supabase:** Used only for storing media files (pictures and videos): profile/cover images, post media, message attachments, stories. No app data or database tables; storage only.

## Documentation

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** — Full setup and implementation guide
- **[NAVICAT_LINUX_GUIDE.md](NAVICAT_LINUX_GUIDE.md)** — Using Navicat on Linux with Laravel Sail
- **[docs/DATABASE_SETUP.md](docs/DATABASE_SETUP.md)** — MySQL (Navicat) vs Sail’s MySQL; why users can be empty; use your host MySQL
- **[docs/SUPABASE_TROUBLESHOOTING.md](docs/SUPABASE_TROUBLESHOOTING.md)** — Supabase media storage connectivity

## Project Structure

- `app/` — Models, Controllers, Services, Policies, Events
- `resources/js/` — React SPA (components, pages, hooks, store)
- `routes/api.php` — REST API routes
- `database/migrations/` — Database schema
- `compose.yaml` — Sail services (MySQL, app, reverb, queue)

## License

MIT
