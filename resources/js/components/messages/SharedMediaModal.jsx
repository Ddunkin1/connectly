import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { messagesAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';

const SharedMediaModal = ({ isOpen, onClose, conversationId }) => {
    const { data, isLoading } = useQuery({
        queryKey: ['conversation-media', conversationId],
        queryFn: () => messagesAPI.getConversationMedia(conversationId),
        enabled: isOpen && !!conversationId,
    });

    const media = data?.data?.media || [];
    const pagination = data?.data?.pagination || {};

    if (!isOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 bg-black/60 z-40"
                onClick={onClose}
                aria-hidden
            />
            <div className="fixed inset-4 md:inset-8 lg:inset-16 z-50 theme-surface rounded-2xl border border-[#2A2A2A] shadow-xl flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2A]">
                    <h3 className="text-lg font-semibold text-white">Shared Media</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-full text-gray-400 hover:bg-white/5 hover:text-white"
                        aria-label="Close"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <LoadingSpinner />
                        </div>
                    ) : media.length === 0 ? (
                        <p className="text-center text-gray-500 py-12">No media shared yet</p>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {media.map((item) => (
                                <a
                                    key={item.id}
                                    href={item.attachment_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="aspect-square rounded-xl overflow-hidden bg-white/5 hover:opacity-90 transition-opacity block"
                                >
                                    {item.attachment_type === 'video' ? (
                                        <div className="relative w-full h-full flex items-center justify-center bg-black/30">
                                            <video
                                                src={item.attachment_url}
                                                className="max-w-full max-h-full object-cover"
                                                muted
                                                playsInline
                                                preload="metadata"
                                            />
                                            <span className="material-symbols-outlined absolute text-4xl text-white drop-shadow-lg">play_circle</span>
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
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default SharedMediaModal;
