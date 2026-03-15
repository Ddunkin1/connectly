import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const MessageUserPanel = ({
    otherUser,
    mediaItems = [],
    pinnedItems = [],
    filesAndLinks = [],
    onViewAllMedia,
    onViewAllPinned,
    onViewAllFiles,
}) => {
    const [muteNotifications, setMuteNotifications] = useState(false);
    const [stickyContact, setStickyContact] = useState(true);

    if (!otherUser) return null;

    return (
        <section className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-[var(--theme-bg-main)]">
            {/* Header: avatar, name, quick actions */}
            <div className="p-6 flex flex-col items-center text-center border-b border-[var(--theme-border)] bg-[var(--theme-bg-main)]">
                <div className="relative mb-4">
                    <img
                        src={otherUser.profile_picture}
                        alt={otherUser.name}
                        className="w-20 h-20 rounded-full object-cover border border-[var(--theme-border)] shadow-sm"
                    />
                </div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">{otherUser.name}</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-0.5 mb-5">@{otherUser.username}</p>

                <div className="flex gap-3 w-full">
                    <Link
                        to={otherUser.username ? `/profile/${otherUser.username}` : '#'}
                        className="flex-1 flex items-center justify-center py-2.5 px-3 rounded-xl bg-white text-black text-sm font-medium hover:bg-slate-100 active:scale-[0.98] transition-all border border-[var(--theme-border)] dark:bg-[var(--theme-surface)] dark:text-[var(--text-primary)] dark:hover:bg-[var(--theme-surface-hover)] no-underline"
                    >
                        Profile
                    </Link>
                    <button
                        type="button"
                        className="flex-1 py-2.5 px-3 rounded-xl bg-[var(--theme-surface)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--theme-surface-hover)] active:scale-[0.98] transition-all border border-[var(--theme-border)]"
                    >
                        Mute
                    </button>
                </div>
            </div>

            <div className="p-5 space-y-5">
                {/* Search within conversation */}
                <div className="rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)] px-4 py-3 flex items-center gap-3">
                    <span className="material-symbols-outlined text-[var(--text-secondary)] text-base">search</span>
                    <input
                        type="text"
                        placeholder="Search in chat..."
                        className="w-full bg-transparent border-0 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-0"
                    />
                </div>

                {/* Pinned items */}
                <div className="rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)] p-5">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-[10px] font-semibold text-[var(--text-primary)]/60 uppercase tracking-wider">
                            Pinned items
                        </h4>
                        <button
                            type="button"
                            onClick={onViewAllPinned}
                            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium"
                        >
                            View All
                        </button>
                    </div>
                    {pinnedItems.length === 0 ? (
                        <p className="text-xs text-[var(--text-secondary)]">No pinned items yet.</p>
                    ) : (
                        <div className="space-y-3 text-sm">
                            {pinnedItems.slice(0, 2).map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    className="w-full text-left rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-hover)] px-3 py-2 hover:border-[var(--theme-border)]/80 transition-colors"
                                    onClick={item.onClick}
                                >
                                    <p className="text-[var(--text-primary)] text-xs line-clamp-2">{item.title}</p>
                                    {item.meta && (
                                        <p className="text-[10px] text-[var(--text-secondary)] mt-1">{item.meta}</p>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Shared media */}
                <div className="rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)] p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-[10px] font-semibold text-[var(--text-primary)]/60 uppercase tracking-wider">
                            Shared media
                        </h4>
                        <button type="button" onClick={onViewAllMedia} className="text-xs text-[var(--text-primary)]/70 hover:text-primary transition-colors font-medium">
                            See All
                        </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {mediaItems.slice(0, 8).map((item) => (
                            <a
                                key={item.id}
                                href={item.attachment_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="aspect-square rounded-lg overflow-hidden bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] hover:border-[var(--theme-border)]/80 transition-colors"
                            >
                                {item.attachment_type === 'video' ? (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="material-symbols-outlined text-2xl text-[var(--text-primary)]/60">videocam</span>
                                    </div>
                                ) : (
                                    <img src={item.attachment_url} alt="Shared" className="w-full h-full object-cover" />
                                )}
                            </a>
                        ))}
                        {mediaItems.length === 0 && (
                            <div className="col-span-4 aspect-video rounded-lg bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] flex items-center justify-center text-xs text-[var(--text-primary)]/60">
                                No media yet
                            </div>
                        )}
                        {mediaItems.length > 8 && (
                            <div className="aspect-square rounded-lg bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] flex items-center justify-center text-xs text-[var(--text-primary)]/70 font-medium">
                                +{mediaItems.length - 8}
                            </div>
                        )}
                    </div>
                </div>

                {/* Files & links */}
                <div className="rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)] p-5">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-[10px] font-semibold text-[var(--text-primary)]/60 uppercase tracking-wider">
                            Files & Links
                        </h4>
                        <button
                            type="button"
                            onClick={onViewAllFiles}
                            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium"
                        >
                            View All
                        </button>
                    </div>
                    {filesAndLinks.length === 0 ? (
                        <p className="text-xs text-[var(--text-secondary)]">No files or links yet.</p>
                    ) : (
                        <div className="space-y-2 text-xs">
                            {filesAndLinks.slice(0, 3).map((item) => (
                                <a
                                    key={item.id}
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-start gap-2 rounded-lg px-3 py-2 hover:bg-[var(--theme-surface-hover)] transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[var(--text-secondary)] text-base">
                                        {item.kind === 'file' ? 'description' : 'link'}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-[var(--text-primary)] truncate">{item.label}</p>
                                        {item.meta && (
                                            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 truncate">
                                                {item.meta}
                                            </p>
                                        )}
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}
                </div>

                {/* Conversation settings / safety */}
                <div className="rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)] p-5">
                    <h4 className="text-[10px] font-semibold text-[var(--text-primary)]/60 uppercase tracking-wider mb-4">Settings</h4>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[var(--text-primary)]">Mute Notifications</span>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={muteNotifications}
                                onClick={() => setMuteNotifications((v) => !v)}
                                className={`relative w-11 h-6 rounded-full transition-all duration-200 ${muteNotifications ? 'bg-primary' : 'bg-[var(--theme-surface-hover)] border border-[var(--theme-border)]'}`}
                            >
                                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-200 ${muteNotifications ? 'left-[22px]' : 'left-0.5'}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[var(--text-primary)]">Sticky Contact</span>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={stickyContact}
                                onClick={() => setStickyContact((v) => !v)}
                                className={`relative w-11 h-6 rounded-full transition-all duration-200 ${stickyContact ? 'bg-primary' : 'bg-[var(--theme-surface-hover)] border border-[var(--theme-border)]'}`}
                            >
                                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-200 ${stickyContact ? 'left-[22px]' : 'left-0.5'}`} />
                            </button>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="w-full mt-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
                    >
                        <span className="material-symbols-outlined text-lg">block</span>
                        Block {otherUser.name}
                    </button>
                </div>
            </div>
        </section>
    );
};

export default MessageUserPanel;
