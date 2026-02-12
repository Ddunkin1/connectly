import React, { useEffect } from 'react';
import useThemeStore, { FONT_SIZES, ACCENT_COLORS, BACKGROUND_THEMES } from '../../store/themeStore';

const ThemeCustomizer = ({ isOpen, onClose }) => {
    const { fontSize, accentColor, background, setFontSize, setAccentColor, setBackground, applyToDom } =
        useThemeStore();

    useEffect(() => {
        if (isOpen) applyToDom();
    }, [isOpen, fontSize, accentColor, background, applyToDom]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={onClose}
        >
            <div
                className="rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)', borderWidth: '1px', borderStyle: 'solid' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6" style={{ borderBottom: '1px solid var(--theme-border)' }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Customize your view</h2>
                            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                                Manage your font size, color, and background.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            aria-label="Close"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Font Size */}
                    <div>
                        <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Font Size</label>
                        <div className="flex items-center gap-4">
                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Aa</span>
                            <div className="flex-1 flex gap-2">
                                {FONT_SIZES.map((size) => (
                                    <button
                                        key={size}
                                        type="button"
                                        onClick={() => setFontSize(size)}
                                        className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
                                            fontSize === size
                                                ? 'text-white'
                                                : 'hover:opacity-90'
                                        }`}
                                        style={
                                            fontSize === size
                                                ? { backgroundColor: 'var(--theme-accent)' }
                                                : { backgroundColor: 'var(--theme-surface-hover)', color: 'var(--text-secondary)' }
                                        }
                                    >
                                        {size === 'sm' ? 'Small' : size === 'md' ? 'Medium' : 'Large'}
                                    </button>
                                ))}
                            </div>
                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Aa</span>
                        </div>
                    </div>

                    {/* Color */}
                    <div>
                        <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Color</label>
                        <div className="flex gap-3 flex-wrap">
                            {Object.entries(ACCENT_COLORS).map(([key, { hex }]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setAccentColor(key)}
                                    className={`w-10 h-10 rounded-full transition-all ${
                                        accentColor === key
                                            ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--theme-surface)] scale-110'
                                            : 'hover:scale-105'
                                    }`}
                                    style={{ backgroundColor: hex }}
                                    title={ACCENT_COLORS[key].name}
                                    aria-label={`Select ${ACCENT_COLORS[key].name} color`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Background */}
                    <div>
                        <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Background</label>
                        <div className="grid grid-cols-3 gap-3">
                            {Object.entries(BACKGROUND_THEMES).map(([key, { name, bg }]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setBackground(key)}
                                    className="flex flex-col items-center gap-2 py-3 px-4 rounded-xl border-2 transition-all hover:opacity-90"
                                    style={{ borderColor: background === key ? 'var(--theme-accent)' : 'var(--theme-border)' }}
                                >
                                    <div
                                        className="w-full h-8 rounded-lg"
                                        style={{ backgroundColor: bg }}
                                    />
                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThemeCustomizer;
