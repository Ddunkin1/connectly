# Supabase 502 / "Can't send picture or update profile picture"

## What you're seeing

- **Browser:** 502 Bad Gateway for `profile-picture` or `/api/messages`
- **Laravel log:** `Supabase upload error: cURL error 28: SSL connection timeout` or `Operation timed out`

That means **your Laravel app server cannot reach Supabase** over the network. Supabase credentials are usually fine; the problem is connectivity from the server to `https://*.supabase.co`.

## Cause

The app uses Supabase Storage for:

- Profile pictures and cover images (upload + proxy when loading)
- Post media, message attachments, group message attachments, stories

When the **server** (where PHP/Laravel runs) cannot open an HTTPS connection to Supabase (timeout, firewall, or DNS), you get:

- **Profile picture 502:** proxy request to fetch the image from Supabase fails.
- **Messages 502:** uploading an attachment to Supabase fails.

So "Supabase is broken" is usually **network from server → Supabase**, not a bad project or keys.

## What to check

**Important:** Run the test from the **same environment where Laravel runs**. If Laravel runs in Docker/Sail or on a remote server, run `curl` (or the tinker test below) **inside that container or on that server**. Curl succeeding from your laptop does **not** mean the app server can reach Supabase.

1. **Where does Laravel run?**  
   If you use **Docker / Sail**, PHP runs inside a container—that container’s network is what matters. If you use **php artisan serve** or Apache/Nginx on your machine, then your machine is the “server.”

2. **Test from the app server/container**  
   From that environment, test outbound HTTPS:
   ```bash
   curl -v --connect-timeout 10 https://your-project-id.supabase.co
   ```
   A successful connection (e.g. HTTP 404 with `{"error":"requested path is invalid"}`) means that environment can reach Supabase. If it hangs or times out, **that** environment cannot reach Supabase—fix firewall or Docker networking there.

3. **Docker / Sail**  
   The container must have outbound internet. First list containers to get the Laravel app container name:
   ```bash
   docker ps
   ```
   Use the **name** in the first column (e.g. `connectly-laravel.test-1` or `sail-laravel.test-1`). Then run curl **inside** that container (replace `CONTAINER_NAME` with the actual name):
   ```bash
   docker exec -it CONTAINER_NAME curl -v --connect-timeout 10 https://your-project-id.supabase.co
   ```
   If it times out inside the container, fix Docker networking (e.g. outbound HTTPS from the container).
   **If you see "Connected" then "SSL connection timeout"** (TCP works, TLS handshake fails): the app now forces **TLS 1.2** for Supabase requests to work around this. Restart the Laravel container and try again; if it still fails, try increasing `SUPABASE_CONNECT_TIMEOUT` in `.env`.

4. **VPN (Surfshark, etc.)**  
   If you use a VPN on your dev machine, it can route (or block) traffic to Supabase and cause **SSL connection timeout** or **Operation timed out**. Try **disabling the VPN** when testing uploads, or use **split tunneling** so Docker/browser traffic to Supabase bypasses the VPN. If uploads work with the VPN off, the VPN was the cause.

5. **Firewall / proxy**  
   Ensure the host (or container) can make outbound HTTPS to `*.supabase.co`. Corporate proxies or strict egress rules can block it.

6. **.env**  
   Confirm:
   - `SUPABASE_URL=https://<project-ref>.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` set (required for uploads and proxy)
   - Optional: `SUPABASE_CONNECT_TIMEOUT` / `SUPABASE_TIMEOUT` in `.env.example` if you want to tune timeouts (defaults are 60s connect, 180s request).

## Quick test from the app server

From the same environment where Laravel runs:

```bash
php artisan tinker
>>> Illuminate\Support\Facades\Http::connectTimeout(10)->timeout(15)->get(config('services.supabase.url'));
```

If you get a timeout or connection error, the fix is network/firewall/Docker, not code or Supabase dashboard.

## Summary

| Symptom              | Likely cause                    | Fix                                      |
|----------------------|----------------------------------|------------------------------------------|
| 502 on profile pic   | Proxy can't fetch from Supabase  | Allow server → Supabase (HTTPS)          |
| 502 on send message  | Upload to Supabase times out     | Same: fix server outbound to Supabase    |
| cURL 28 / SSL timeout | Server cannot reach supabase.co   | Firewall, Docker network, DNS, or **VPN** (try disabling or split tunneling) |

Your Supabase project and keys are likely fine; ensure the **machine running Laravel** can reach `https://<your-project>.supabase.co`.
