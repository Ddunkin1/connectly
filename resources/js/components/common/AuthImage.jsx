import React, { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Renders an image from an authenticated API URL (e.g. /api/user/storage-image?path=...).
 * Fetches with Bearer token and displays via blob URL so the image loads correctly.
 */
function AuthImage({ src, alt = '', className = '', ...imgProps }) {
    const token = useAuthStore((state) => state.token);
    const [blobUrl, setBlobUrl] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!src || !token) {
            setBlobUrl(null);
            setError(!!src && !token);
            return;
        }
        setError(false);
        setBlobUrl(null);
        const fullUrl = src.startsWith('http') ? src : `${API_URL.replace(/\/api\/?$/, '')}${src.startsWith('/') ? '' : '/'}${src}`;
        let blobUrlToRevoke = null;
        let cancelled = false;
        fetch(fullUrl, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
                if (!res.ok) throw new Error(res.status);
                return res.blob();
            })
            .then((blob) => {
                if (cancelled) return;
                const url = URL.createObjectURL(blob);
                blobUrlToRevoke = url;
                setBlobUrl(url);
            })
            .catch(() => {
                if (!cancelled) setError(true);
            });
        return () => {
            cancelled = true;
            if (blobUrlToRevoke) URL.revokeObjectURL(blobUrlToRevoke);
        };
    }, [src, token]);

    if (error || !src) {
        return (
            <div className={`w-full h-full min-h-[80px] flex items-center justify-center bg-[var(--theme-surface-hover)] ${className}`}>
                <span className="material-symbols-outlined text-[var(--text-secondary)]/50">broken_image</span>
            </div>
        );
    }
    if (!blobUrl) {
        return (
            <div className={`w-full h-full min-h-[80px] flex items-center justify-center bg-[var(--theme-surface-hover)] animate-pulse ${className}`}>
                <span className="material-symbols-outlined text-[var(--text-secondary)]/30">image</span>
            </div>
        );
    }
    return <img src={blobUrl} alt={alt} className={className} {...imgProps} />;
}

export default AuthImage;
