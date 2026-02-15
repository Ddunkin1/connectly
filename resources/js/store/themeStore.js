import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const THEME_KEY = 'connectly-theme';

export const FONT_SIZES = ['sm', 'md', 'lg'];
export const ACCENT_COLORS = {
    purple: { name: 'Purple', hex: '#8B5CF6' },
    yellow: { name: 'Yellow', hex: '#EAB308' },
    red: { name: 'Red', hex: '#EF4444' },
    peachy: { name: 'Peachy', hex: '#F472B6' },
    teal: { name: 'Teal', hex: '#14B8A6' },
    blue: { name: 'Blue', hex: '#3B82F6' },
};
export const BACKGROUND_THEMES = {
    light: {
        name: 'Light',
        bg: '#f5f7f8',
        sidebar: '#ffffff',
        surface: '#ffffff',
        surfaceHover: '#f0f2f4',
        feedBg: '#f5f7f8',
        feedMuted: '#eef0f2',
        textPrimary: '#1a1a1a',
        textSecondary: '#475569',
        border: 'rgba(0,0,0,0.12)',
        cardShadow: '0 1px 3px rgba(0,0,0,0.08)',
        glassBg: 'rgba(255,255,255,0.9)',
    },
    dim: {
        name: 'Dim',
        bg: '#121212',
        sidebar: '#161616',
        surface: '#1A1A1A',
        surfaceHover: '#16161E',
        feedBg: '#121212',
        feedMuted: '#141414',
        textPrimary: '#ffffff',
        textSecondary: '#a0a0a0',
        border: '#26262E',
        cardShadow: '0 2px 8px rgba(0,0,0,0.2)',
        glassBg: 'rgba(26,26,29,0.6)',
    },
};

const useThemeStore = create(
    persist(
        (set) => ({
            fontSize: 'md',
            accentColor: 'peachy',
            background: 'dim',
            isCustomizerOpen: false,
            setFontSize: (fontSize) => {
                set({ fontSize });
                useThemeStore.getState().applyToDom();
            },
            setAccentColor: (accentColor) => {
                set({ accentColor });
                useThemeStore.getState().applyToDom();
            },
            setBackground: (background) => {
                set({ background });
                useThemeStore.getState().applyToDom();
            },
            openCustomizer: () => set({ isCustomizerOpen: true }),
            closeCustomizer: () => set({ isCustomizerOpen: false }),
            applyToDom: () => {
                const state = useThemeStore.getState();
                const root = document.documentElement;
                root.setAttribute('data-font-size', state.fontSize);
                root.setAttribute('data-accent', state.accentColor);
                root.setAttribute('data-background', state.background);
                const theme = BACKGROUND_THEMES[state.background];
                if (theme) {
                    root.style.setProperty('--theme-bg-main', theme.bg);
                    root.style.setProperty('--theme-bg-sidebar', theme.sidebar);
                    root.style.setProperty('--theme-surface', theme.surface);
                    root.style.setProperty('--theme-surface-hover', theme.surfaceHover ?? theme.surface);
                    root.style.setProperty('--bg-primary', theme.bg);
                    root.style.setProperty('--bg-secondary', theme.feedMuted);
                    root.style.setProperty('--bg-feed', theme.surface);
                    root.style.setProperty('--bg-feed-muted', theme.feedBg);
                    root.style.setProperty('--text-primary', theme.textPrimary);
                    root.style.setProperty('--text-secondary', theme.textSecondary);
                    root.style.setProperty('--theme-border', theme.border);
                    root.style.setProperty('--border-color', theme.border);
                    root.style.setProperty('--shadow-card', theme.cardShadow);
                    root.style.setProperty('--glass-bg', theme.glassBg);
                }
                const accent = ACCENT_COLORS[state.accentColor];
                if (accent) {
                    const accentHover = adjustBrightness(accent.hex, -15);
                    root.style.setProperty('--theme-accent', accent.hex);
                    root.style.setProperty('--theme-accent-hover', accentHover);
                    root.style.setProperty('--color-primary', accent.hex);
                    root.style.setProperty('--color-primary-dark', accentHover);
                    root.style.setProperty('--accent-primary', accent.hex);
                }
                const isDark = state.background === 'dim';
                root.classList.toggle('dark', isDark);
            },
        }),
        {
            name: THEME_KEY,
            version: 3,
            partialize: (s) => ({ fontSize: s.fontSize, accentColor: s.accentColor, background: s.background }),
            onRehydrateStorage: () => () => useThemeStore.getState().applyToDom(),
            migrate: (persistedState, version) => {
                let next = persistedState ?? {};
                if (version < 2 && next?.accentColor === 'purple') {
                    next = { ...next, accentColor: 'peachy' };
                }
                if (version < 3 && ['stitch', 'dark'].includes(next?.background)) {
                    next = { ...next, background: 'dim' };
                }
                return next;
            },
        }
    )
);

function adjustBrightness(hex, amount) {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amount));
    return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
}

export default useThemeStore;
