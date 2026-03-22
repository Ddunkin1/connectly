import React from 'react';
import useThemeStore from '../../store/themeStore';

/**
 * Switches global appearance (light / dim) using the same tokens as the main app.
 * Sets `html.dark` and CSS variables via themeStore.applyToDom.
 */
export default function AdminThemeToggle({ className = '' }) {
    const background = useThemeStore((s) => s.background);
    const setBackground = useThemeStore((s) => s.setBackground);

    const isDark = background === 'dim';

    return (
        <button
            type="button"
            onClick={() => setBackground(isDark ? 'light' : 'dim')}
            className={`inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-hover)]/80 px-3 py-2 text-sm font-medium text-[var(--text-primary)] shadow-sm transition-colors hover:border-[var(--theme-accent)]/45 hover:bg-[var(--theme-surface-hover)] ${className}`}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}
        >
            <span className="material-symbols-outlined text-[22px] leading-none text-[var(--theme-accent)]">
                {isDark ? 'light_mode' : 'dark_mode'}
            </span>
            <span className="hidden sm:inline tabular-nums">{isDark ? 'Light' : 'Dark'}</span>
        </button>
    );
}
