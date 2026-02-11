import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import axios from 'axios';

window.Pusher = Pusher;

let echoInstance = null;
let lastToken = null;

function getAuthToken() {
    try {
        const raw = localStorage.getItem('auth-storage');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.state?.token ?? null;
    } catch {
        return null;
    }
}

/**
 * Build broadcast auth URL - must point to Laravel API, not Vite dev server.
 * Set VITE_BROADCAST_AUTH_URL in .env to override (e.g. http://localhost/api/broadcasting/auth)
 */
function getAuthEndpoint() {
    if (import.meta.env.VITE_BROADCAST_AUTH_URL) {
        return import.meta.env.VITE_BROADCAST_AUTH_URL;
    }
    const base = (import.meta.env.VITE_APP_URL || import.meta.env.VITE_API_URL || window.location.origin)
        .replace(/\/api\/?$/, '');
    return `${base}/api/broadcasting/auth`;
}

export function getEcho() {
    const token = getAuthToken();
    if (!token) {
        if (echoInstance) {
            echoInstance.disconnect();
            echoInstance = null;
            lastToken = null;
        }
        return null;
    }

    const key = import.meta.env.VITE_REVERB_APP_KEY;
    const host = import.meta.env.VITE_REVERB_HOST || 'localhost';
    const port = import.meta.env.VITE_REVERB_PORT || '8080';
    const scheme = import.meta.env.VITE_REVERB_SCHEME || 'http';

    if (!key) return null;

    if (echoInstance && lastToken === token) {
        return echoInstance;
    }

    if (echoInstance) {
        echoInstance.disconnect();
    }

    lastToken = token;
    const authEndpoint = getAuthEndpoint();

    // Custom authorizer: explicit control over auth request (fixes 403 with Bearer + Sanctum)
    const authorizer = (channel) => ({
        authorize: (socketId, callback) => {
            const formData = new FormData();
            formData.append('socket_id', socketId);
            formData.append('channel_name', channel.name);

            axios
                .post(authEndpoint, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                })
                .then((res) => callback(false, res.data))
                .catch((err) => callback(true, err));
        },
    });

    echoInstance = new Echo({
        broadcaster: 'reverb',
        key,
        wsHost: host,
        wsPort: port,
        wssPort: port,
        forceTLS: scheme === 'https',
        enabledTransports: ['ws', 'wss'],
        authEndpoint,
        authorizer,
    });

    if (import.meta.env.DEV) {
        const conn = echoInstance?.connector?.pusher?.connection;
        if (conn) {
            conn.bind('connected', () => console.log('[Echo] Realtime WebSocket connected'));
            conn.bind('error', (err) => console.warn('[Echo] WebSocket error:', err?.message || err));
            conn.bind('unavailable', () => console.warn('[Echo] WebSocket unavailable - Reverb may not be running'));
            conn.bind('failed', () => console.warn('[Echo] WebSocket connection failed - check auth and Reverb'));
        }
    }

    return echoInstance;
}
