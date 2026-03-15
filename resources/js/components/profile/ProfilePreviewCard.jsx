import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../common/Avatar';

/**
 * Floating profile preview card: shows user photo, name, and quick actions.
 * Use when the user clicks "View profile" from a list (e.g. Connections, search).
 * Professional UX: quick preview without leaving the page; "View full profile" for full page.
 */
const ProfilePreviewCard = ({ user, isOpen, onClose }) => {
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen || !user) return null;

    const { name, username, profile_picture } = user;

    return (
        <>
            <div
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                aria-hidden="true"
                onClick={onClose}
            />
            <div
                className="fixed left-1/2 top-1/2 z-50 w-[min(90vw,340px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-post-card"
                role="dialog"
                aria-modal="true"
                aria-label="Profile preview"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-3 top-3 rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--theme-surface-hover)] hover:text-[var(--text-primary)] transition-colors"
                    aria-label="Close"
                >
                    <span className="material-symbols-outlined text-xl">close</span>
                </button>

                <div className="flex flex-col items-center text-center">
                    <Avatar
                        src={profile_picture}
                        alt={name}
                        className="w-20 h-20 rounded-full ring-2 ring-[var(--theme-border)] shadow-post-card"
                    />
                    <h3 className="mt-4 text-lg font-semibold text-[var(--text-primary)] truncate w-full">
                        {name || 'Unknown'}
                    </h3>
                    {username && (
                        <p className="text-sm text-[var(--text-secondary)] truncate w-full">@{username}</p>
                    )}

                    <div className="mt-6 flex w-full flex-col gap-2">
                        <Link
                            to={`/profile/${username}`}
                            onClick={onClose}
                            className="flex items-center justify-center gap-2 rounded-xl bg-[var(--theme-accent)] px-4 py-3 font-medium text-white hover:opacity-90 transition-opacity"
                        >
                            <span className="material-symbols-outlined text-lg">person</span>
                            View full profile
                        </Link>
                        <Link
                            to={`/messages/${username}`}
                            onClick={onClose}
                            className="flex items-center justify-center gap-2 rounded-xl border border-[var(--theme-border)] px-4 py-3 font-medium text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">mail</span>
                            Message
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProfilePreviewCard;
