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

3. **Result**
   - All API requests (register, login, posts, etc.) go to `VITE_API_URL` instead of the same origin. If you omit this, the frontend calls `/api` on the Vercel URL and gets HTML instead of JSON, so registration and login fail.

## Backend (Laravel)

1. **Host**
   - Deploy the Laravel app on a PHP-capable host (e.g. Railway, Render, Fly.io, shared hosting, or a VPS).

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
