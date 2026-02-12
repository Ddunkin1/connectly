import React, { useState } from 'react';
const MessageChatHeader = ({ otherUser }) => {
    const [showMenu, setShowMenu] = useState(false);

    if (!otherUser) return null;

    return (
        <header className="h-20 px-6 flex items-center justify-between border-b border-[var(--theme-border)] bg-[var(--theme-bg-main)]/50 backdrop-blur-md">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <img src={otherUser.profile_picture} alt={otherUser.name} className="w-10 h-10 rounded-full object-cover" />
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[var(--theme-bg-main)] rounded-full" />
                </div>
                <div>
                    <h2 className="font-bold text-sm text-white">{otherUser.name}</h2>
                    <p className="text-[10px] text-green-500 font-medium">Active now</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <button type="button" className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-[var(--theme-surface-hover)] transition-colors" aria-label="Video call">
                    <span className="material-symbols-outlined">videocam</span>
                </button>
                <button type="button" className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-[var(--theme-surface-hover)] transition-colors" aria-label="Voice call">
                    <span className="material-symbols-outlined">call</span>
                </button>
                <div className="relative">
                    <button type="button" onClick={() => setShowMenu(!showMenu)} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-[var(--theme-surface-hover)] transition-colors" aria-label="More options">
                        <span className="material-symbols-outlined">more_vert</span>
                    </button>
                    {showMenu && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowMenu(false)}
                                aria-hidden="true"
                            />
                            <div className="absolute right-0 mt-1 w-48 theme-surface border border-[var(--theme-border)] rounded-xl shadow-lg py-1 z-20">
                                <button
                                    type="button"
                                    className="w-full text-left px-4 py-2 text-gray-300 hover:bg-white/5 flex items-center gap-2 rounded-lg mx-1"
                                >
                                    <span className="material-symbols-outlined text-lg">push_pin</span>
                                    Pinned Messages
                                </button>
                                <button
                                    type="button"
                                    className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/10 flex items-center gap-2 rounded-lg mx-1"
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
