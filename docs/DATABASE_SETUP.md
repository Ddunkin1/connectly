# Database setup: MySQL (Navicat) vs Sail’s MySQL

## Why did my users disappear? (Navicat shows zero users)

**Short answer:** The app is now using a **different** MySQL data store than the one that had your users. Nothing was “deleted”; we switched to a new, empty database.

**What happened:**

1. When we fixed the Sail container conflict, we switched to a new Compose project name (`connectlyapp`). Docker then created a **new** MySQL volume (`connectlyapp_sail-mysql`) for that project.
2. Laravel and Navicat (when you connect to `127.0.0.1:3306`) both use that **new** database. We ran migrations there, so the **tables** exist (e.g. `users`) but there are **no rows** — it’s a fresh DB.
3. Your **old** user data was in a **previous** MySQL volume (from the old project name, e.g. `connectly_sail-mysql`). That volume is still on disk, but the app is no longer using it.

**Recovery:** A script tried to recover from the old volumes (`connectly_sail-mysql`, `connectly_connectly-mysql-data`, `connectly-app_connectly-mysql-data`). The dumps came back empty (no usable `connectly_app` data in those volumes). So:

- **If you have a backup** (Navicat export, `mysqldump` file, or any `.sql` from when you had users): restore it into the current database (the one Navicat shows at 127.0.0.1:3306, `connectly_app`). In Navicat: open that connection → right‑click `connectly_app` → run the SQL file or paste the backup.
- **If you don’t have a backup:** You’ll need to re‑register users. To avoid this in future, use **Option B** below (MySQL on your machine) and/or take regular backups (e.g. Navicat backup or `mysqldump`).

You can try the recovery script again if you have another volume or backup:  
`./scripts/recover-users-from-old-volume.sh [volume-name]`  
(List volumes with `docker volume ls | grep mysql`.)

---

## How it works

- **Laravel (and Navicat)** use **one** MySQL database for all app data: users, posts, sessions, messages, etc.
- **Supabase** is used only for **media files** (pictures, videos) so your disk doesn’t fill up. No app data is stored there.

So: **MySQL = your data. Supabase = images/videos only.**

---

## Why were my users empty?

If you see no rows in the `users` table in Navicat, it’s usually one of these:

1. **New Sail project / new MySQL volume**  
   When the Sail project name was changed (e.g. to `connectlyapp`), Docker created a **new** MySQL volume. That database is empty until you run migrations (and then register users again). Your old users were in the **previous** volume.

2. **You’re looking at the right MySQL**  
   Navicat must connect to the **same** MySQL that Laravel uses (see below). If Laravel uses the host’s MySQL and you open a different MySQL in Navicat, you won’t see the same data.

---

## Option A: MySQL inside Sail (default)

- Sail starts a **MySQL container** and a **volume** for its data.
- Laravel connects to it with `DB_HOST=mysql` in `.env`.
- **Navicat** connects to the **same** database using:
  - Host: `127.0.0.1`
  - Port: `3306`
  - Database: `connectly_app`
  - User / password: same as `DB_USERNAME` / `DB_PASSWORD` in `.env`

So: **Docker runs both the app and MySQL. Navicat is just a client to that MySQL.**  
Data is stored in a Docker volume. If you recreate the project/volume, you get a new empty DB (and need to run migrations again).

---

## Option B: MySQL on your machine (Navicat = “the” database)

If you want:

- **Docker (Sail)** = only server (Laravel, queue, Reverb, Vite, etc.)
- **MySQL** = only on your laptop (or server), managed by you and opened in Navicat
- **Supabase** = only for images/videos

then use **one** MySQL instance on your **host** and point Laravel to it.

### 1. Install and run MySQL on your machine

Example on Fedora:

```bash
sudo dnf install community-mysql-server
sudo systemctl start mysqld
sudo systemctl enable mysqld
```

Create the database and user (adjust user/password as you like):

```bash
sudo mysql -e "CREATE DATABASE connectly_app;"
sudo mysql -e "CREATE USER 'sail'@'%' IDENTIFIED BY 'password';"
sudo mysql -e "GRANT ALL ON connectly_app.* TO 'sail'@'%';"
sudo mysql -e "FLUSH PRIVILEGES;"
```

(On some setups you may use `'sail'@'localhost'` and/or a different user.)

### 2. Point Laravel to the host’s MySQL

In **`.env`** (not `.env.example`), set:

```env
DB_CONNECTION=mysql
DB_HOST=host.docker.internal
DB_PORT=3306
DB_DATABASE=connectly_app
DB_USERNAME=sail
DB_PASSWORD=password
```

`host.docker.internal` is the host machine as seen from inside the Sail container, so the app in Docker will use the MySQL running on your laptop.

### 3. Stop Sail from starting its own MySQL

Edit **`compose.yaml`**:

1. Remove **`mysql`** from the `depends_on` list of **`laravel.test`** (so it no longer waits for the `mysql` service).
2. Comment out or remove the entire **`mysql:`** service block (image, ports, environment, volumes, healthcheck).

Example for `laravel.test`:

```yaml
        depends_on:
            - redis
            - meilisearch
            - mailpit
            - selenium
```

(No `mysql` in the list.)

### 4. Start Sail and run migrations

```bash
./vendor/bin/sail up -d
./vendor/bin/sail artisan migrate --force
```

From now on:

- **Navicat** and **Laravel** both use the MySQL on your host.
- All users and app data are in that one database (the one you see in Navicat).
- Sail only runs the app stack; it does not run MySQL.
- Supabase remains for pictures/videos only.

---

## Summary

| What              | Role                                      |
|-------------------|-------------------------------------------|
| **MySQL (Navicat)** | All app data (users, posts, sessions, etc.) |
| **Supabase**      | Media only (images, videos)              |
| **Docker (Sail)** | Runs the app (and optionally MySQL)      |

- **Option A:** Sail runs MySQL in Docker; Navicat connects to it at `127.0.0.1:3306`.
- **Option B:** MySQL runs on your machine; you set `DB_HOST=host.docker.internal` and disable the `mysql` service in `compose.yaml` so Sail is app-only and Navicat is your single database.
