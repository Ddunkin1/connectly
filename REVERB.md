# Laravel Reverb – Real-Time Social

Connectly uses [Laravel Reverb](https://laravel.com/docs/reverb) for real-time WebSocket updates:

- **Messages:** Direct and group messages
- **Notifications:** Likes, comments, shares, friend requests, mentions

**For real-time to work**, Reverb and the queue worker must run. Without them, users will need to refresh to see new messages and notifications.

## Running with Sail

Reverb and the queue worker run automatically when you start Sail. Port 8080 is exposed by the `reverb` service.

```bash
./vendor/bin/sail up
```

This starts the web app, database, Reverb WebSocket server, and queue worker (for broadcast notifications) together.

## Environment

Required in `.env`:

```
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=connectly-app
REVERB_APP_KEY=connectly-key
REVERB_APP_SECRET=connectly-secret
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http

VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"
```

## Troubleshooting

- **Messages/notifications not arriving in real-time:** Ensure Reverb and the queue worker are running (both start with `sail up`).
- **Private channel auth fails (403):** Broadcast auth uses Bearer token and hits `/api/broadcasting/auth`.
  1. Set `VITE_APP_URL` in `.env` to your Laravel server URL (Sail: `http://localhost`, `php artisan serve`: `http://localhost:8000`).
  2. Or set `VITE_BROADCAST_AUTH_URL` explicitly: `http://localhost/api/broadcasting/auth`
  3. **Important:** Run `npm run build` or restart `npm run dev` after changing env vars.
- **CORS:** Ensure `config/cors.php` includes your frontend origin (e.g. `http://localhost:5173`).

## Production

- Run Reverb behind a reverse proxy (e.g. Nginx) with WebSocket upgrade headers.
- Use Supervisor or similar to keep `php artisan reverb:start` running.
- Set `REVERB_HOST` and `VITE_REVERB_*` to your public Reverb host.
