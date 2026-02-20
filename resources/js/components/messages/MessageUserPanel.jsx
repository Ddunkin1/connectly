import React, { useState } from 'react';

const MessageUserPanel = ({ otherUser, mediaItems = [], onViewAllMedia }) => {
    const [muteNotifications, setMuteNotifications] = useState(false);
    const [stickyContact, setStickyContact] = useState(true);

    if (!otherUser) return null;

    const email = otherUser.email ?? '—';
    const phone = otherUser.phone ?? '—';

    return (
        <section className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-[#1A1A1A]">
            <div className="p-5 flex flex-col items-center text-center border-b border-[#3A3A3A]">
                <div className="relative mb-3">
                    <img src={otherUser.profile_picture} alt={otherUser.name} className="w-20 h-20 rounded-full object-cover" />
                </div>
                <h3 className="text-lg font-semibold text-white">{otherUser.name}</h3>
                <p className="text-sm text-slate-500 mb-4">{otherUser.title || `@${otherUser.username}`}</p>
                <div className="flex gap-2 w-full">
                    <button type="button" className="flex-1 py-2.5 px-3 rounded-xl bg-[#2C2C2C] text-white text-sm font-medium hover:bg-[#353535] active:scale-[0.98] transition-all border border-[#3A3A3A]">
                        Profile
                    </button>
                    <button type="button" className="flex-1 py-2.5 px-3 rounded-xl bg-[#2C2C2C] text-white text-sm font-medium hover:bg-[#353535] active:scale-[0.98] transition-all border border-[#3A3A3A]">
                        Mute
                    </button>
                </div>
            </div>

            <div className="p-4 space-y-4">
                <div className="rounded-xl bg-[#1E1E1E] border border-[#3A3A3A] p-4">
                    <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Personal info</h4>
                    <div className="space-y-2.5">
                        <div className="flex items-center gap-3 text-sm">
                            <span className="material-symbols-outlined text-slate-500 text-lg">alternate_email</span>
                            <div className="min-w-0">
                                <p className="text-[10px] text-slate-500 uppercase">Email</p>
                                <p className="text-white truncate">{email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <span className="material-symbols-outlined text-slate-500 text-lg">phone</span>
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase">Phone</p>
                                <p className="text-white">{phone}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl bg-[#1E1E1E] border border-[#3A3A3A] p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Shared media</h4>
                        <button type="button" onClick={onViewAllMedia} className="text-xs text-slate-400 hover:text-primary transition-colors font-medium">
                            See All
                        </button>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                        {mediaItems.slice(0, 8).map((item) => (
                            <a
                                key={item.id}
                                href={item.attachment_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="aspect-square rounded-lg overflow-hidden bg-[#2C2C2C] border border-[#3A3A3A] hover:border-[#4A4A4A] transition-colors"
                            >
                                {item.attachment_type === 'video' ? (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="material-symbols-outlined text-2xl text-slate-500">videocam</span>
                                    </div>
                                ) : (
                                    <img src={item.attachment_url} alt="Shared" className="w-full h-full object-cover" />
                                )}
                            </a>
                        ))}
                        {mediaItems.length === 0 && (
                            <div className="col-span-4 aspect-video rounded-lg bg-[#2C2C2C] border border-[#3A3A3A] flex items-center justify-center text-xs text-slate-500">
                                No media yet
                            </div>
                        )}
                        {mediaItems.length > 8 && (
                            <div className="aspect-square rounded-lg bg-[#2C2C2C] border border-[#3A3A3A] flex items-center justify-center text-xs text-slate-400 font-medium">
                                +{mediaItems.length - 8}
                            </div>
                        )}
                    </div>
                </div>

                <div className="rounded-xl bg-[#1E1E1E] border border-[#3A3A3A] p-4">
                    <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Settings</h4>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-white">Mute Notifications</span>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={muteNotifications}
                                onClick={() => setMuteNotifications((v) => !v)}
                                className={`relative w-11 h-6 rounded-full transition-all duration-200 ${muteNotifications ? 'bg-primary' : 'bg-[#2C2C2C] border border-[#3A3A3A]'}`}
                            >
                                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-200 ${muteNotifications ? 'left-[22px]' : 'left-0.5'}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-white">Sticky Contact</span>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={stickyContact}
                                onClick={() => setStickyContact((v) => !v)}
                                className={`relative w-11 h-6 rounded-full transition-all duration-200 ${stickyContact ? 'bg-primary' : 'bg-[#2C2C2C] border border-[#3A3A3A]'}`}
                            >
                                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-200 ${stickyContact ? 'left-[22px]' : 'left-0.5'}`} />
                            </button>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="w-full mt-4 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
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
