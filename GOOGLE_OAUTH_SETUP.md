# Google OAuth (Gmail Login) Setup

## 1. Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**
2. Create **OAuth 2.0 Client ID** (Web application)
3. Add **Authorized redirect URIs** (must match exactly):
   - Sail (port 80): `http://localhost/api/auth/google/callback`
   - php artisan serve (port 8000): `http://localhost:8000/api/auth/google/callback`
   - Production: `https://yourdomain.com/api/auth/google/callback`
4. Copy **Client ID** and **Client secret** to your `.env`

## 2. Environment Variables

Ensure your `.env` has:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret

# Redirect URI must exactly match Google Console (no trailing slash)
# For Sail/default port 80:
APP_URL=http://localhost

# Optional overrides (defaults use APP_URL):
# GOOGLE_REDIRECT_URI=http://localhost/api/auth/google/callback
# FRONTEND_URL=http://localhost
```

**Important:** If you run Laravel on a different port (e.g. `php artisan serve` uses 8000), set:
- `APP_URL=http://localhost:8000`
- Or explicitly: `GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback`

## 3. Database

Run migrations so the `users` table has `provider` and `provider_id`:

```bash
php artisan migrate
```

## 4. Test

1. Visit `/login`
2. Click "Continue with Google"
3. Sign in with your Google account
4. You should be redirected back and logged in

## Troubleshooting

- **"redirect_uri_mismatch"**: The redirect URI in Google Console must match exactly (including protocol, port, and path).
- **"Could not authenticate with google"**: Check Laravel logs (`storage/logs/laravel.log`). Often a session/state issue or invalid credentials.
- **No token received**: Ensure `FRONTEND_URL` (or `APP_URL`) points to where your SPA is served (e.g. `http://localhost` for Sail).
