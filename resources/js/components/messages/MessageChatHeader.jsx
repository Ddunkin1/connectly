import React, { useState } from 'react';
import { callAPI } from '../../services/api';
import toast from 'react-hot-toast';

const MessageChatHeader = ({ otherUser, conversationId, onBack }) => {
    const [showMenu, setShowMenu]   = useState(false);
    const [calling, setCalling]     = useState(false);

    if (!otherUser) return null;

    const handleVideoCall = async () => {
        if (calling || !conversationId) return;
        setCalling(true);
        try {
            const [tokenRes] = await Promise.all([
                callAPI.generateToken(conversationId),
                callAPI.initiate(conversationId),
            ]);
            const { room_name } = tokenRes.data;
            window.dispatchEvent(new CustomEvent('open-video-call', {
                detail: { room_name, conversation_id: conversationId },
            }));
        } catch {
            toast.error('Could not start video call. Please try again.');
        } finally {
            setCalling(false);
        }
    };

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

                {/* Video call button — initiates Agora call */}
                <button
                    type="button"
                    onClick={handleVideoCall}
                    disabled={calling || !conversationId}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-primary)]/80 hover:bg-[var(--theme-surface-hover)] hover:text-[var(--text-primary)] transition-all disabled:opacity-50"
                    aria-label="Video call"
                >
                    {calling ? (
                        <div className="w-4 h-4 border-2 border-current/40 border-t-current rounded-full animate-spin" />
                    ) : (
                        <span className="material-symbols-outlined text-xl">videocam</span>
                    )}
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
