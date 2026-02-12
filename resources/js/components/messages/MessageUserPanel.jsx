import React from 'react';
import { Link } from 'react-router-dom';
const MessageUserPanel = ({ otherUser, mediaItems = [], onViewAllMedia }) => {
    if (!otherUser) return null;

    return (
        <section className="w-72 shrink-0 border-l border-[#26262E] flex flex-col bg-[#0A0A0B] overflow-y-auto custom-scrollbar">
            <div className="p-8 flex flex-col items-center text-center">
                <div className="relative mb-4">
                    <img src={otherUser.profile_picture} alt={otherUser.name} className="w-24 h-24 rounded-full object-cover ring-4 ring-[#16161E]" />
                    <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-4 border-[#0A0A0B] rounded-full" />
                </div>
                <h3 className="text-lg font-bold text-white">{otherUser.name}</h3>
                <p className="text-sm text-slate-500 mb-6">@{otherUser.username}</p>
                <div className="flex gap-4 mb-8">
                    <button type="button" className="flex flex-col items-center gap-1 group">
                        <div className="w-10 h-10 rounded-full bg-[#16161E] flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                            <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-white">person</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">Profile</span>
                    </button>
                    <button type="button" className="flex flex-col items-center gap-1 group">
                        <div className="w-10 h-10 rounded-full bg-[#16161E] flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                            <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-white">notifications_off</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">Mute</span>
                    </button>
                    <button type="button" className="flex flex-col items-center gap-1 group">
                        <div className="w-10 h-10 rounded-full bg-[#16161E] flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                            <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-white">search</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">Search</span>
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 custom-scrollbar pb-8">
                <div className="space-y-6">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Shared Media</h4>
                            <button type="button" onClick={onViewAllMedia} className="text-[10px] font-bold text-primary">View All</button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {mediaItems.slice(0, 6).map((item) => (
                                <a
                                    key={item.id}
                                    href={item.attachment_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="aspect-square rounded-lg overflow-hidden bg-white/5 hover:opacity-80 transition-opacity"
                                >
                                    {item.attachment_type === 'video' ? (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="material-symbols-outlined text-3xl text-gray-500">videocam</span>
                                        </div>
                                    ) : (
                                        <img
                                            src={item.attachment_url}
                                            alt="Shared media"
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </a>
                            ))}
                            {mediaItems.length === 0 && (
                                <div className="col-span-3 w-full h-16 bg-[#16161E] rounded-lg flex items-center justify-center text-xs font-bold text-slate-400">No media yet</div>
                            )}
                        </div>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Chat Settings</h4>
                        <div className="space-y-2">
                            <button type="button" className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#16161E] transition-colors text-sm text-white">
                                <span>Pinned Messages</span>
                                <span className="material-symbols-outlined text-slate-400 text-lg">chevron_right</span>
                            </button>
                            <button type="button" className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#16161E] transition-colors text-red-500">
                                <span className="text-sm">Block User</span>
                                <span className="material-symbols-outlined text-lg">block</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MessageUserPanel;
