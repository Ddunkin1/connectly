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
    light: { name: 'Light', bg: '#f5f7f8', sidebar: '#ffffff', surface: '#ffffff' },
    dim: { name: 'Dim', bg: '#0F0F1A', sidebar: '#1A1A2E', surface: '#252538' },
    dark: { name: 'Lights Out', bg: '#000000', sidebar: '#0a0a0a', surface: '#1a1a1a' },
};

const useThemeStore = create(
    persist(
        (set) => ({
            fontSize: 'md',
            accentColor: 'purple',
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
                const bg = BACKGROUND_THEMES[state.background];
                if (bg) {
                    root.style.setProperty('--theme-bg-main', bg.bg);
                    root.style.setProperty('--theme-bg-sidebar', bg.sidebar);
                    root.style.setProperty('--theme-surface', bg.surface);
                }
                const accent = ACCENT_COLORS[state.accentColor];
                if (accent) {
                    root.style.setProperty('--theme-accent', accent.hex);
                    root.style.setProperty('--theme-accent-hover', adjustBrightness(accent.hex, -15));
                }
            },
        }),
        {
            name: THEME_KEY,
            partialize: (s) => ({ fontSize: s.fontSize, accentColor: s.accentColor, background: s.background }),
            onRehydrateStorage: () => () => useThemeStore.getState().applyToDom(),
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
