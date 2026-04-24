import React, { useState } from 'react';

const GroupChatHeader = ({ group, onInviteClick, onBack }) => {
    const [showMenu, setShowMenu] = useState(false);

    if (!group) return null;

    const memberCount = group.members?.length ?? 0;

    return (
        <header className="h-16 px-3 sm:px-5 flex items-center justify-between border-b border-[var(--theme-border)] bg-[var(--theme-bg-main)]">
            <div className="flex items-center gap-2 sm:gap-3">
                {onBack && (
                    <button
                        type="button"
                        onClick={onBack}
                        className="sm:hidden w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-primary)]/80 hover:bg-[var(--theme-surface-hover)] shrink-0"
                        aria-label="Back to groups"
                    >
                        <span className="material-symbols-outlined text-xl">arrow_back</span>
                    </button>
                )}
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                    {group.name?.charAt(0)?.toUpperCase() || 'G'}
                </div>
                <div>
                    <h2 className="font-semibold text-sm text-[var(--text-primary)]">{group.name}</h2>
                    <p className="text-[10px] text-primary font-medium">{memberCount} {memberCount === 1 ? 'member' : 'members'}</p>
                </div>
            </div>
            <div className="flex items-center gap-1">
                {onInviteClick && (
                    <button
                        type="button"
                        onClick={onInviteClick}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-primary)]/80 hover:bg-[var(--theme-surface-hover)] hover:text-[var(--text-primary)] transition-all"
                        aria-label="Invite to group"
                    >
                        <span className="material-symbols-outlined text-xl">person_add</span>
                    </button>
                )}
                <div className="relative">
                    <button type="button" onClick={() => setShowMenu(!showMenu)} className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-primary)]/80 hover:bg-[var(--theme-surface-hover)] hover:text-[var(--text-primary)] transition-all" aria-label="More options">
                        <span className="material-symbols-outlined text-xl">info</span>
                    </button>
                    {showMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} aria-hidden="true" />
                            <div className="absolute right-0 mt-1 w-48 bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] rounded-xl py-1 z-20 shadow-lg">
                                <button type="button" className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--theme-surface)] flex items-center gap-2 rounded-lg mx-1">
                                    <span className="material-symbols-outlined text-lg">push_pin</span>
                                    Pinned Messages
                                </button>
                                <div className="my-1 border-t border-[var(--theme-border)]" />
                                <button type="button" className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 rounded-lg mx-1">
                                    <span className="material-symbols-outlined text-lg">logout</span>
                                    Leave group
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default GroupChatHeader;
