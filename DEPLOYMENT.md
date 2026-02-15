# Connectly deployment guide

This app has two parts: a **frontend** (React/Vite) and a **Laravel API** backend. Registration and login only work when the frontend can reach the API.

## Frontend (Vercel)

1. **Build and output**
   - Build command: `npm run build` (see [vercel.json](vercel.json))
   - Output directory: `public/build`

2. **Environment variable (required for registration/login)**
   - Set **`VITE_API_URL`** in your Vercel project:
     - **Vercel** → Project → **Settings** → **Environment Variables**
   - Value: the **full base URL** of your Laravel API, including the `/api` path if your API uses it.
     - Example: `https://connectly-api.railway.app/api` (Laravel API routes are under `/api` by default)
     - No trailing slash.
   - **Redeploy** after adding or changing this variable. `VITE_*` is baked in at build time.

3. **Seeing your latest push**
   - **Redeploy** rebuilds the **same** commit; it does not pull the latest from Git. To see new code: push to your connected branch — Vercel will create a **new** deployment for that commit. Open the **Deployments** tab and check the top entry; it should show your latest commit.
   - If **Production** (e.g. `connectly-lake.vercel.app`) is tied to a different branch (e.g. `main`), then pushing only to `feature1` updates the **preview** URL (e.g. `connectly-git-feature1-…vercel.app`), not Production. To update Production: merge into the production branch and push, or set **Settings → Git → Production Branch** to the branch you push (e.g. `feature1`).

4. **Result**
   - All API requests (register, login, posts, etc.) go to `VITE_API_URL` instead of the same origin. If you omit this, the frontend calls `/api` on the Vercel URL and gets HTML instead of JSON, so registration and login fail.

## Backend (Laravel)

1. **Host**
   - Deploy the Laravel app on a PHP-capable host (e.g. Railway, Render, Fly.io, shared hosting, or a VPS).

### Railway (recommended: use the Dockerfile)

This repo includes a [Dockerfile](Dockerfile) that runs the Laravel API with `php artisan serve`. **Railway uses the Dockerfile when present**, so your app will serve correctly and `/api/user`, `/api/auth/google`, etc. will work (no 404s).

1. Connect the repo to Railway and deploy. Do **not** set a custom “Build” or “Start” command—let Railway use the Dockerfile.
2. In Railway → your service → **Variables**, set at least:
   - `APP_KEY` (run `php artisan key:generate` locally and paste the value)
   - `APP_URL` = `https://connectly-api.railway.app` (or your Railway API domain)
   - `FRONTEND_URL` = your Vercel app URL (e.g. `https://connectly-lake.vercel.app`)
   - `CORS_ALLOWED_ORIGINS` = same as `FRONTEND_URL`
   - Database: `DB_*` or `DATABASE_URL` (if you use a Railway Postgres/MySQL or external DB)
3. In **Networking**, generate a public domain (e.g. `connectly-api.railway.app`).

If you remove the Dockerfile and deploy with Nixpacks instead, use the [nixpacks.toml](nixpacks.toml) and variables below so the web root is `public/`.

### Railway (Nixpacks, if not using Dockerfile)

Railway can build with [Nixpacks](https://nixpacks.com/docs/providers/php) if no Dockerfile is present. By default the web root is the project root; **Laravel must be served from `public/`** or you get 404s. This repo’s [nixpacks.toml](nixpacks.toml) sets `NIXPACKS_PHP_ROOT_DIR=/app/public` and `NIXPACKS_PHP_FALLBACK_PATH=/index.php`. Alternatively set those in Railway → Variables.

Recommended Railway variables for the API:

- `APP_URL` = your Railway API URL (e.g. `https://connectly-api.railway.app`)
- `APP_KEY` = from `php artisan key:generate`
- `FRONTEND_URL` = your Vercel app URL (e.g. `https://connectly-lake.vercel.app`)
- `CORS_ALLOWED_ORIGINS` = same as `FRONTEND_URL` (or comma-separated list)
- `LOG_CHANNEL` = `stderr` (so logs show in Railway dashboard)
- `LOG_STDERR_FORMATTER` = `\Monolog\Formatter\JsonFormatter` (optional, for structured logs)
- Database: `DB_*` or `DATABASE_URL` as per your database service

2. **Environment**
   - Configure `.env` on the server with at least:
     - `APP_URL` – public URL of the Laravel app (e.g. `https://connectly-api.railway.app`)
     - `APP_KEY` – run `php artisan key:generate` if needed
     - Database: `DB_*` (e.g. `DB_CONNECTION`, `DB_HOST`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`)
     - Optional: Supabase or other services used by the app (e.g. profile picture upload)

3. **CORS**
   - The frontend runs on a different origin (e.g. `https://connectly-three-pi.vercel.app`). The API must allow that origin.
   - Edit [config/cors.php](config/cors.php): add your **frontend URL(s)** to `allowed_origins` (no trailing slash).
   - Or set `CORS_ALLOWED_ORIGINS` in `.env` (comma-separated list of origins).
   - After changing CORS: `php artisan config:clear` (and `php artisan config:cache` in production if you use it).

4. **Routes**
   - Laravel API routes are under the `api` prefix, so register is at **`POST /api/register`**. Ensure `VITE_API_URL` on Vercel points to the base that includes `/api` (e.g. `https://your-api.com/api`) so the frontend calls the correct URL.

## Result

- **Registration** and **login** requests go from the Vercel frontend to your Laravel API.
- The API returns JSON; the frontend shows success or validation errors instead of "Registration failed" or "Could not reach the server."

If users see "Could not reach the server" or "Server returned an invalid response," check:

1. **VITE_API_URL** on Vercel is set and points to the Laravel API base URL (including `/api` if applicable), and you redeployed after setting it.
2. **CORS** on the Laravel host includes the frontend origin (e.g. your Vercel URL) in `allowed_origins`.

## Production checklist

Use this when deploying with a Vercel frontend and a separate Laravel API host:

1. **Vercel:** Set `VITE_API_URL` to your API base URL including `/api` (e.g. `https://your-api.com/api`). Redeploy after changing it.
2. **Laravel API server:** In `.env`, set `APP_URL` (API public URL), `FRONTEND_URL` (Vercel app URL, e.g. `https://connectlyproject.vercel.app`), and `CORS_ALLOWED_ORIGINS` (same as `FRONTEND_URL`, or comma-separated list of frontend origins). Run `php artisan config:clear` and `php artisan config:cache`.
3. **Google OAuth:** On the API server, ensure `APP_URL` (and optional `GOOGLE_REDIRECT_URI`) match the callback URL. In Google Cloud Console, add the redirect URI `https://your-api-domain.com/api/auth/google/callback`. See [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md) for the "Production (Vercel + separate API)" section.
