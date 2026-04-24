import React, { useState } from 'react';
const MessageChatHeader = ({ otherUser, onBack }) => {
    const [showMenu, setShowMenu] = useState(false);

    if (!otherUser) return null;

    return (
        <header className="h-16 px-3 sm:px-6 flex items-center justify-between border-b border-[var(--theme-border)] bg-[var(--theme-bg-main)] shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {onBack && (
                    <button
                        type="button"
                        onClick={onBack}
                        className="sm:hidden w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-primary)]/80 hover:bg-[var(--theme-surface-hover)] shrink-0"
                        aria-label="Back to conversations"
                    >
                        <span className="material-symbols-outlined text-xl">arrow_back</span>
                    </button>
                )}
                <div className="relative shrink-0">
                    <img src={otherUser.profile_picture} alt={otherUser.name} className="w-10 h-10 rounded-full object-cover" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary border-2 border-[var(--theme-bg-main)] rounded-full" />
                </div>
                <div className="min-w-0">
                    <h2 className="font-semibold text-sm text-[var(--text-primary)] truncate">{otherUser.name}</h2>
                    <p className="text-[10px] text-primary font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
                        Online
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <button type="button" className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-primary)]/80 hover:bg-[var(--theme-surface-hover)] hover:text-[var(--text-primary)] transition-all" aria-label="Voice call">
                    <span className="material-symbols-outlined text-xl">call</span>
                </button>
                <button type="button" className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-primary)]/80 hover:bg-[var(--theme-surface-hover)] hover:text-[var(--text-primary)] transition-all" aria-label="Video call">
                    <span className="material-symbols-outlined text-xl">videocam</span>
                </button>
                <div className="relative">
                    <button type="button" onClick={() => setShowMenu(!showMenu)} className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-primary)]/80 hover:bg-[var(--theme-surface-hover)] hover:text-[var(--text-primary)] transition-all" aria-label="Info">
                        <span className="material-symbols-outlined text-xl">info</span>
                    </button>
                    {showMenu && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowMenu(false)}
                                aria-hidden="true"
                            />
                            <div className="absolute right-0 mt-1 w-48 bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] rounded-lg py-1 z-20 shadow-lg">
                                <button
                                    type="button"
                                    className="w-full text-left px-4 py-2 text-[var(--text-primary)] hover:bg-[var(--theme-surface)] flex items-center gap-2 rounded mx-1 text-sm"
                                >
                                    <span className="material-symbols-outlined text-lg">push_pin</span>
                                    Pinned Messages
                                </button>
                                <button
                                    type="button"
                                    className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/10 flex items-center gap-2 rounded mx-1 text-sm"
                                >
                                    <span className="material-symbols-outlined text-lg">block</span>
                                    Block User
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default MessageChatHeader;
