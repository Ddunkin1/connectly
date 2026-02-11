# Connectly — Setup & Implementation Guide

This guide walks through setting up the Connectly project for development and presentation, using Laravel Sail, MySQL, and Navicat.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Step-by-Step Setup](#step-by-step-setup)
4. [Navicat Database Connection](#navicat-database-connection)
5. [Project Structure](#project-structure)
6. [Tech Stack](#tech-stack)
7. [Running the Application](#running-the-application)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Docker** — [Install Docker](https://docs.docker.com/engine/install/)
- **Node.js** (v18+) — For frontend build
- **Git**
- **Navicat** (or compatible MySQL client) — For database management. See [NAVICAT_LINUX_GUIDE.md](NAVICAT_LINUX_GUIDE.md) for Linux setup.

---

## Quick Start

```bash
# 1. Clone and configure
git clone <repository-url>
cd connectly
cp .env.example .env

# 2. Start Sail and run migrations
./vendor/bin/sail up -d
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan migrate

# 3. Install frontend deps and build
npm install
npm run build

# 4. (Optional) Seed sample data
./vendor/bin/sail artisan db:seed
```

Open http://localhost (or http://localhost:80) in your browser.

---

## Step-by-Step Setup

### 1. Clone and Configure Environment

```bash
git clone <repository-url>
cd connectly
cp .env.example .env
```

Edit `.env` if needed. For Sail, ensure:

```env
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=connectly_app
DB_USERNAME=sail
DB_PASSWORD=password
```

### 2. Start Laravel Sail

```bash
./vendor/bin/sail up -d
```

This starts:

- **laravel.test** — PHP app (port 80)
- **mysql** — MySQL 8.4 (port 3306)
- **reverb** — WebSocket server (port 8080)
- **queue** — Background job worker

### 3. Generate Key and Run Migrations

```bash
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan migrate
```

### 4. (Optional) Seed Database

```bash
./vendor/bin/sail artisan db:seed
```

### 5. Frontend Setup

```bash
npm install
npm run build
```

For development with hot reload:

```bash
npm run dev
```

---

## Navicat Database Connection

Use these settings in Navicat to connect to the Sail MySQL database:

| Field | Value |
|-------|-------|
| **Connection Name** | Connectly (Sail) |
| **Host** | `127.0.0.1` |
| **Port** | `3306` |
| **User Name** | `sail` |
| **Password** | `password` |
| **Database** | `connectly_app` |

**Important:** Use `127.0.0.1`, not `localhost` — `localhost` uses a Unix socket that Sail does not expose.

See [NAVICAT_LINUX_GUIDE.md](NAVICAT_LINUX_GUIDE.md) for detailed Navicat setup on Linux.

---

## Project Structure

```
connectly/
├── app/
│   ├── Events/              # Broadcasting events (MessageSent, etc.)
│   ├── Http/
│   │   ├── Controllers/Api/ # API controllers
│   │   ├── Middleware/
│   │   └── Requests/
│   ├── Models/              # Eloquent models
│   ├── Notifications/       # Notification classes
│   ├── Policies/            # Authorization policies
│   └── Services/            # Business logic (PostService, MediaService, etc.)
├── config/                  # Application configuration
├── database/
│   ├── migrations/          # Database schema
│   └── seeders/             # Seed data
├── resources/
│   ├── js/                  # React SPA
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Route-level pages
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API client
│   │   ├── store/           # Zustand state (auth, theme)
│   │   └── utils/           # Helpers
│   └── views/               # Blade templates
├── routes/
│   ├── api.php              # REST API routes
│   ├── web.php              # SPA entry (catch-all)
│   └── channels.php         # Broadcast channels
├── compose.yaml             # Sail services (MySQL, app, reverb, queue)
├── SETUP_GUIDE.md           # This file
├── NAVICAT_LINUX_GUIDE.md   # Navicat on Linux
└── tools/                   # Navicat launcher scripts
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Laravel 12, PHP 8.5 |
| Frontend | React 18, Vite, Tailwind CSS |
| Database | MySQL 8.4 |
| Auth | Laravel Sanctum (API tokens) |
| Real-time | Laravel Reverb, Echo |
| Dev Environment | Laravel Sail (Docker) |
| Database GUI | Navicat |

---

## Running the Application

### Production-style (built assets)

```bash
./vendor/bin/sail up -d
# App at http://localhost
```

### Development (Vite dev server)

```bash
./vendor/bin/sail up -d
npm run dev
# App at http://localhost (or Vite port if proxied)
```

Reverb and queue run in the background when Sail is up.

### Manual Reverb / Queue (if not in Sail)

```bash
./vendor/bin/sail artisan reverb:start
./vendor/bin/sail artisan queue:work
```

---

## Troubleshooting

### "Can't connect to MySQL" in Navicat

- Use Host `127.0.0.1`, not `localhost`
- Ensure Sail is running: `./vendor/bin/sail up -d`
- Check port: `docker ps` — MySQL should map 3306

### Port 3306 already in use

Set `FORWARD_DB_PORT=3307` in `.env` and use port 3307 in Navicat.

### Frontend not loading

- Run `npm run build`
- Ensure `public/build` contains compiled assets
- Check browser console for errors

### Reverb / real-time not working

- Reverb runs on port 8080
- Ensure `BROADCAST_DRIVER=reverb` in `.env` (or equivalent)
- Check CORS and VITE_* env vars for frontend

---

*Last updated: February 2025*
