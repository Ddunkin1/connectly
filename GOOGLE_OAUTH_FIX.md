# Fix Google OAuth

## "Could not authenticate with google" – Troubleshooting

When you see this error, the real cause is now shown in the message (with APP_DEBUG=true) or in `storage/logs/laravel.log`.

### 1. redirect_uri_mismatch (Most Common)
**Fix:** The redirect URI must match **exactly** in Google Console.

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**
2. Open your **OAuth 2.0 Client ID** (Web application)
3. Under **Authorized redirect URIs** add exactly:
   - `http://localhost/api/auth/google/callback` (no trailing slash, no port)
4. Under **Authorized JavaScript origins** add:
   - `http://localhost`
5. Click **Save** (changes can take a few minutes to apply)

### 2. Wrong Credentials
- Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env` match the values from Google Console
- Run `php artisan config:clear` (or `sail artisan config:clear`) after changing `.env`

### 3. OAuth Consent Screen
- Go to **APIs & Services** → **OAuth consent screen**
- Add your Google account as a test user if the app is in "Testing" mode

### 4. Clear Config Cache
```bash
./vendor/bin/sail artisan config:clear
```
