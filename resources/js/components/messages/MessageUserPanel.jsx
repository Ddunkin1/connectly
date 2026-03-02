import React, { useState } from 'react';

const MessageUserPanel = ({ otherUser, mediaItems = [], onViewAllMedia }) => {
    const [muteNotifications, setMuteNotifications] = useState(false);
    const [stickyContact, setStickyContact] = useState(true);

    if (!otherUser) return null;

    const email = otherUser.email ?? '—';
    const phone = otherUser.phone ?? '—';

    return (
        <section className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-[var(--theme-bg-main)]">
            <div className="p-6 flex flex-col items-center text-center border-b border-[var(--theme-border)]">
                <div className="relative mb-4">
                    <img src={otherUser.profile_picture} alt={otherUser.name} className="w-20 h-20 rounded-full object-cover" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">{otherUser.name}</h3>
                <p className="text-sm text-[var(--text-primary)]/60 mt-1 mb-5">{otherUser.title || `@${otherUser.username}`}</p>
                <div className="flex gap-3 w-full">
                    <button type="button" className="flex-1 py-2.5 px-3 rounded-xl bg-[var(--theme-surface)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--theme-surface-hover)] active:scale-[0.98] transition-all border border-[var(--theme-border)]">
                        Profile
                    </button>
                    <button type="button" className="flex-1 py-2.5 px-3 rounded-xl bg-[var(--theme-surface)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--theme-surface-hover)] active:scale-[0.98] transition-all border border-[var(--theme-border)]">
                        Mute
                    </button>
                </div>
            </div>

            <div className="p-5 space-y-5">
                <div className="rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)] p-5">
                    <h4 className="text-[10px] font-semibold text-[var(--text-primary)]/60 uppercase tracking-wider mb-4">Personal info</h4>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                            <span className="material-symbols-outlined text-[var(--text-primary)]/60 text-lg">alternate_email</span>
                            <div className="min-w-0">
                                <p className="text-[10px] text-[var(--text-primary)]/60 uppercase">Email</p>
                                <p className="text-[var(--text-primary)] truncate">{email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <span className="material-symbols-outlined text-[var(--text-primary)]/60 text-lg">phone</span>
                            <div>
                                <p className="text-[10px] text-[var(--text-primary)]/60 uppercase">Phone</p>
                                <p className="text-[var(--text-primary)]">{phone}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)] p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-[10px] font-semibold text-[var(--text-primary)]/60 uppercase tracking-wider">Shared media</h4>
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
