# Fix Google OAuth – Stop the Loop

## The Problem
You see `localhost:3000/login?error=...` and `ERR_CONNECTION_REFUSED` because:
- Your app runs on **port 80** (http://localhost) with Sail
- Something is redirecting to **port 3000**, where nothing is running

## The Fix (Do These 3 Steps)

### Step 1: Update Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**
2. Open your **OAuth 2.0 Client ID** (Web application)
3. Under **Authorized redirect URIs**, remove `http://localhost:3000/...` if present
4. Add exactly: `http://localhost/api/auth/google/callback` (no port = port 80)
5. Under **Authorized JavaScript origins**, add: `http://localhost`
6. Click **Save**

### Step 2: Restart Sail
```bash
./vendor/bin/sail down
./vendor/bin/sail up -d
```

### Step 3: Use the Correct URL
- Open `http://localhost` in your browser (not localhost:3000)
- Click "Continue with Google"
- Complete sign-in on Google

---

**Important:** With Laravel Sail, the app is on port 80. Use `http://localhost` only. Do not use port 3000 unless you have a separate frontend configured for it.
