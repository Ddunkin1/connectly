/**
 * Encode media URLs so they work in all browsers (Edge fails on spaces in src).
 * Replaces spaces with %20 and other invalid path chars.
 */
export function encodeMediaUrl(url) {
    if (!url || typeof url !== 'string') return '';
    try {
        const parsed = new URL(url);
        parsed.pathname = parsed.pathname
            .split('/')
            .map((seg) => encodeURIComponent(decodeURIComponent(seg)))
            .join('/');
        return parsed.toString();
    } catch {
        return url.replace(/ /g, '%20');
    }
}
