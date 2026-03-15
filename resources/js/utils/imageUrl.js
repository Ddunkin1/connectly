/**
 * Use for profile_picture and cover_image. Returns null for proxy URLs (so we don't
 * request them and get 502) or invalid paths. Use the returned value as img src.
 * Supabase URLs (e.g. .../profile-pictures/... or .../cover-images/...) are allowed.
 */
export function sanitizeUserImageUrl(url) {
    if (!url || typeof url !== 'string') return null;
    const u = url.trim();
    if (!u) return null;
    if (u.includes('/tmp/') || u.includes('\\tmp\\') || /^php[a-z0-9]{10,}$/i.test(u)) return null;
    // Only strip Laravel proxy paths (e.g. /api/users/1/profile-picture), not Supabase storage URLs
    const isProxyPath = (u.includes('/profile-picture') || u.includes('/cover-image')) && !u.includes('supabase.co');
    if (isProxyPath) return null;
    return u;
}
