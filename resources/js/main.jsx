/**
 * Bootstrap entry: load app and show any load/render error on the page.
 * Vite input should be main.jsx so module load errors are caught here.
 */
import '../css/app.css';

function isPublicPath(pathname) {
    const normalized = (pathname || '/').replace(/\/$/, '') || '/';
    return (
        normalized === '/' ||
        normalized === '/login' ||
        normalized === '/register' ||
        normalized === '/forgot-password' ||
        normalized === '/auth/callback' ||
        normalized === '/admin/login' ||
        normalized === '/account-banned' ||
        normalized.startsWith('/reset-password')
    );
}

function showError(message, detail) {
    const app = document.getElementById('app');
    if (!app) return;
    const detailStr = detail ? `<pre style="background:#f5f5f5;padding:12px;overflow:auto;font-size:12px;margin-top:8px;">${String(detail)}</pre>` : '';
    app.innerHTML = `
        <div style="padding: 24px; font-family: sans-serif; max-width: 640px; margin: 20px auto;">
            <h2 style="color: #c00;">Connectly failed to load</h2>
            <p style="margin: 12px 0;">${message}</p>
            ${detailStr}
            <p style="margin-top: 16px; font-size: 14px; color: #666;">Check the browser console (F12) for more details. Fix the error and refresh.</p>
        </div>
    `;
}

// Dynamic import so we can catch module load errors (e.g. failed imports)
import('./app.jsx')
    .then(async (module) => {
        if (import.meta.env.DEV && !isPublicPath(window.location.pathname)) {
            await new Promise((r) => setTimeout(r, 3000));
        }
        if (typeof module.mountApp === 'function') {
            module.mountApp();
        } else {
            showError('App did not export mountApp().');
        }
    })
    .catch((err) => {
        console.error('App load error:', err);
        showError(
            err?.message || 'Failed to load the application.',
            err?.stack || err?.toString?.()
        );
    });
