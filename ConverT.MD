# Switch Connectly to Laravel Herd + Navicat

**Instructor requirement:** Use Laravel Herd and Navicat (no Laragon). This plan migrates your Connectly project to that setup and removes Laragon from the workflow.

---

## Status: Herd and Navicat Installed

**You have already installed:**
- Laravel Herd (Windows)
- Navicat

**Next:** Follow the steps below to export your data from Laragon, move the project to Herd, and use Navicat for the database.

---

## Pre-Flight: What Was Checked and Prepared

**Checked:**
- Project location: `c:\laragon\www\connectly-app`
- Database: MySQL `connectly_app` (in Laragon)
- `.env` exists with MySQL + Supabase config
- `api.js` uses `VITE_API_URL || '/api'` – will need `VITE_API_URL` set for Herd
- Herd directory exists: `C:\Users\james\Herd` (empty – project not moved yet)

**Prepared by Cursor:**
- `.env.example` – updated with MySQL defaults and Herd URL comments
- `config/services.php` – added optional `FFMPEG_PATH` for video transcoding
- `C:\backup` – folder created for database export (save `connectly_app.sql` here)

**Not changed (you will update after moving):**
- `.env` – keep as-is until after Phase 3 (moving project), then update `APP_URL` and add `VITE_API_URL`

---

## Quick Checklist (Do in Order)

1. **Phase 1** – Export database from Laragon, backup project (do this while Laragon is still running)
2. **Phase 2** – Stop Laragon, start MySQL (Herd Pro or DBngin), import database
3. **Phase 3** – Move project to Herd directory
4. **Phase 4** – Update `.env` and config
5. **Phase 5** – Set up Navicat connection to new MySQL
6. **Phase 6** – Verify and run the app

---

## Current State

- **Location**: `c:\laragon\www\connectly-app`
- **Database**: MySQL (`connectly_app`) – currently in Laragon's MySQL
- **Stack**: Laravel 12, PHP 8.2+, React/Vite, Supabase (media), FFmpeg (video transcoding)

---

## Phase 1: Export from Laragon (Do First – Laragon Must Be Running)

### 1.1 Export MySQL Database from Laragon

1. Ensure Laragon is running with MySQL
2. **Using Navicat** (recommended since you have it):
   - Open Navicat → New Connection → MySQL
   - Host: 127.0.0.1, Port: 3306, Username: root, Password: (empty)
   - Connect (this connects to Laragon's MySQL)
   - Right-click `connectly_app` database → Dump SQL File → save to `C:\backup\connectly_app.sql`
3. **Or using CLI**: `mysqldump -u root connectly_app > C:\backup\connectly_app.sql`

### 1.2 Document Current Config

From `.env.example`, your project supports both SQLite and MySQL. Capture your current `.env` DB values (do not commit):

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=connectly_app
DB_USERNAME=root
DB_PASSWORD=
```

### 1.3 Backup Project

- Copy entire `c:\laragon\www\connectly-app` to a safe location, or
- Ensure project is in Git with all changes committed

---

## Phase 2: Stop Laragon, Start MySQL, Import Database

**Important:** Herd is installed, but Herd Free does not include MySQL. You need a MySQL server running (Herd Pro's MySQL or DBngin).

### 2.1 Stop Laragon

- Fully stop Laragon (including MySQL) to free port 3306 and 80
- Do not start Laragon again until migration is complete

### 2.2 Start MySQL

**If you have Herd Pro:**
- Open Herd → Services tab → Install/Start MySQL
- Default: root, no password, port 3306

**If you have Herd Free (no MySQL):**
- Install [DBngin](https://dbngin.com/) (free)
- Add a MySQL server, start it
- Default: root, no password, port 3306 (or 3307 if 3306 is in use)

### 2.3 Import Database

**Using Navicat:**
1. New Connection → MySQL → Host: 127.0.0.1, Port: 3306, root, (no password)
2. Connect (this connects to Herd Pro MySQL or DBngin)
3. Right-click → New Database → name: `connectly_app`
4. Right-click `connectly_app` → Execute SQL File → select `C:\backup\connectly_app.sql` → Start

**Or using CLI:**
```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS connectly_app;"
mysql -u root connectly_app < C:\backup\connectly_app.sql
```

---

## Phase 3: Move Project and Link Site

### 3.1 Move Project to Herd Directory

**Important:** Close Cursor (and any other apps using the folder) first, or the move will fail with "item is in use."

Then run this in PowerShell (as Administrator if needed):

```powershell
Move-Item -Path "c:\laragon\www\connectly-app" -Destination "C:\Users\james\Herd\connectly-app"
```

This **moves** (not copies) the folder to `C:\Users\james\Herd\connectly-app`. The site will be at `http://connectly-app.test` once Herd is running.

### 3.2 Stop and Uninstall Laragon (Optional)

- Fully stop Laragon to avoid port 3306 and 80 conflicts
- You can uninstall Laragon after confirming everything works in Herd

---

## Phase 4: Update Project Configuration

### 4.1 Update .env

**Do this after moving the project to Herd (Phase 3).** Edit `.env` in the new location:

1. Change `APP_URL=http://localhost` to `APP_URL=http://connectly-app.test`
2. Add this line (for frontend API calls): `VITE_API_URL=http://connectly-app.test`
3. Keep DB settings as-is (they match Herd Pro / DBngin default)

Your `.env` DB block should look like:

```env
APP_URL=http://connectly-app.test

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=connectly_app
DB_USERNAME=root
DB_PASSWORD=

VITE_API_URL=http://connectly-app.test
```

If DBngin uses a different port (e.g. 3307), set `DB_PORT=3307`.

**FFmpeg:** If video uploads fail, add `FFMPEG_PATH=C:\path\to\ffmpeg.exe` to `.env` (or install ffmpeg and add to system PATH).

### 4.2 Update API Base URL (Frontend)

In `resources/js/services/api.js`, the base URL likely uses `import.meta.env.VITE_API_URL` or similar. Ensure it points to `http://connectly-app.test` when running under Herd. Check `vite.config.js` and any proxy config.

### 4.3 FFmpeg (Video Transcoding)

Herd does not include FFmpeg. Either:

- Install FFmpeg and add to system PATH, or
- Add to `config/services.php`: `'ffmpeg' => ['path' => 'C:\\ffmpeg\\bin\\ffmpeg.exe']` (adjust path)

### 4.4 Storage Link

```bash
cd %USERPROFILE%\Herd\connectly-app
php artisan storage:link
```

---

## Phase 5: Navicat Connection for Herd (Dedicated Connection)

You may have used Navicat in Phase 1 to export from Laragon. Now create a **new connection** for Herd's MySQL (or DBngin) so you don't mix them up.

### 5.1 Create New Connection in Navicat

1. Open Navicat → Connection → MySQL
2. **Connection name**: Connectly (Herd)
3. **Host**: 127.0.0.1
4. **Port**: 3306 (or 3307 if using DBngin on that port)
5. **Username**: root
6. **Password**: (empty)
7. Test connection → Save

### 5.2 Use Navicat for Database Tasks

- Expand connection → `connectly_app` database
- Use for: browsing tables, running queries, editing data, importing/exporting
- This is your main database tool going forward (instructor requirement)

---

## Phase 6: Verify and Run

### 6.1 Clear Caches

```bash
php artisan config:clear
php artisan cache:clear
php artisan view:clear
```

### 6.2 Run Migrations (If Needed)

If you imported a full dump, migrations may already be applied. If starting fresh or schema differs:

```bash
php artisan migrate --force
```

### 6.3 Start Development

```bash
# Terminal 1: Laravel + Vite (or use composer dev)
php artisan serve
# Or rely on Herd: visit http://connectly-app.test

# Terminal 2: Vite (for hot reload)
npm run dev
```

If using Herd's built-in nginx, visit `http://connectly-app.test` directly. The Vite dev server may need `VITE_API_URL=http://connectly-app.test` so API calls hit the correct host.

### 6.4 Test Critical Paths

- [ ] Login/Register
- [ ] Create post (text, image, video)
- [ ] Friend request flow
- [ ] Messages
- [ ] Communities
- [ ] Supabase media uploads (unchanged; cloud-based)

---

## Phase 7: Optional Optimizations

### 7.1 Windows Defender Exclusion

Add exclusion for `%USERPROFILE%\.config\herd` to reduce slowdowns ([Herd docs](https://herd.laravel.com/docs/windows/getting-started/installation#performance)).

### 7.2 Herd Secure (HTTPS)

For HTTPS: `herd secure connectly-app` (from project directory). Update `APP_URL` and `VITE_API_URL` to `https://connectly-app.test`.

### 7.3 Cursor/IDE Protocol

Herd Settings → General → set default IDE (e.g. Cursor/VS Code) for `herd edit`.

---

## File Change Summary

| File                  | Change                                            |
| --------------------- | ------------------------------------------------- |
| `.env`                | Update `APP_URL`, `DB_*`, `VITE_API_URL` for Herd |
| `config/services.php` | Optional: add `ffmpeg.path` if FFmpeg not in PATH |

No code changes required if config is env-driven.

---

## Reference Links

- [Herd Windows Installation](https://herd.laravel.com/docs/windows/getting-started/installation)
- [Migrating from Laragon to Herd](https://herd.laravel.com/docs/windows/migration-guides/laragon)
- [Herd Sites and Parked Paths](https://herd.laravel.com/docs/windows/getting-started/sites)
- [Herd Databases](https://herd.laravel.com/docs/windows/getting-started/databases)
