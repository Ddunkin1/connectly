import React, { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDeleteGroupMessage, useGroupConversationWithMessages, useUpdateGroupMessage } from '../../hooks/useGroupConversations';
import { getEcho } from '../../echo';
import Avatar from '../common/Avatar';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';
import { formatDate } from '../../utils/formatDate';
import useAuthStore from '../../store/authStore';

const formatMessageTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

const GroupMessageThread = ({ groupId }) => {
    const user = useAuthStore((state) => state.user);
    const queryClient = useQueryClient();
    const updateMutation = useUpdateGroupMessage();
    const deleteMutation = useDeleteGroupMessage();
    const { data, isLoading, error, isError } = useGroupConversationWithMessages(groupId);
    const messagesEndRef = useRef(null);
    const editFileInputRef = useRef(null);
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editingText, setEditingText] = useState('');
    const [editingMediaFile, setEditingMediaFile] = useState(null);
    const [editingMediaPreview, setEditingMediaPreview] = useState(null);
    const [openMenuMessageId, setOpenMenuMessageId] = useState(null);
    const [messageToDelete, setMessageToDelete] = useState(null);
    const menuRef = useRef(null);

    const messages = data?.messages || [];
    const group = data?.group;
    const members = group?.members || [];
    const getSenderDisplayName = (senderId) => {
        const m = members.find((x) => x.id === senderId);
        return (m?.pivot?.nickname?.trim()) || m?.name || 'Unknown';
    };

    const patchGroupMessageInCache = (patchedMessage) => {
        if (!patchedMessage) return;
        queryClient.setQueryData(['group-conversation', groupId], (old) => {
            if (!old?.data) return old;
            const existing = old.data.messages || [];
            return {
                ...old,
                data: {
                    ...old.data,
                    messages: existing.map((m) => (m.id === patchedMessage.id ? { ...m, ...patchedMessage } : m)),
                },
            };
        });
    };

    // Subscribe to real-time group messages via Reverb
    useEffect(() => {
        if (!groupId) return;
        const echo = getEcho();
        if (!echo) return;

        const channel = echo.private(`group-conversation.${groupId}`);
        channel.listen('.GroupMessageSent', (payload) => {
            const newMessage = payload?.message;
            if (!newMessage) return;
            const currentUser = useAuthStore.getState().user;
            if (newMessage.sender?.id === currentUser?.id) return;

            queryClient.setQueryData(['group-conversation', groupId], (old) => {
                if (!old?.data) return old;
                const existing = old.data.messages || [];
                const exists = existing.some((m) => m.id === newMessage.id);
                if (exists) return old;
                return {
                    ...old,
                    data: {
                        ...old.data,
                        messages: [...existing, newMessage],
                    },
                };
            });
        });
        channel.listen('.GroupMessageUpdated', (payload) => {
            patchGroupMessageInCache(payload?.message);
        });
        channel.listen('.GroupMessageDeleted', (payload) => {
            patchGroupMessageInCache(payload?.message);
        });

        return () => {
            channel.stopListening('.GroupMessageSent');
            channel.stopListening('.GroupMessageUpdated');
            channel.stopListening('.GroupMessageDeleted');
            echo.leave(`group-conversation.${groupId}`);
        };
    }, [groupId, queryClient]);
    // Backend returns latest first; reverse for chronological display
    const orderedMessages = [...messages].reverse();

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [orderedMessages.length]);

    const startEdit = (message) => {
        setEditingMessageId(message.id);
        setEditingText(message.content || '');
        setEditingMediaFile(null);
        setEditingMediaPreview(message.attachment_url || null);
    };

    const cancelEdit = () => {
        setEditingMessageId(null);
        setEditingText('');
        setEditingMediaFile(null);
        setEditingMediaPreview(null);
        if (editFileInputRef.current) {
            editFileInputRef.current.value = '';
        }
    };

    const handleEditFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setEditingMediaFile(file);
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => setEditingMediaPreview(reader.result);
            reader.readAsDataURL(file);
            return;
        }
        setEditingMediaPreview(URL.createObjectURL(file));
    };

    const submitEdit = async (messageId) => {
        const payload = new FormData();
        payload.append('content', editingText);
        if (editingMediaFile) {
            payload.append('media', editingMediaFile);
        }
        try {
            await updateMutation.mutateAsync({ messageId, data: payload });
            cancelEdit();
        } catch {
            // Error toast handled by hook
        }
    };

    const confirmDelete = (messageId) => {
        setOpenMenuMessageId(null);
        setMessageToDelete(messageId);
    };

    const deleteMessage = async () => {
        if (!messageToDelete) return;
        try {
            await deleteMutation.mutateAsync(messageToDelete);
            setMessageToDelete(null);
        } catch {
            // Error toast handled by hook
        }
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpenMenuMessageId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <LoadingSpinner />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col justify-center items-center h-full p-4">
                <p className="text-red-500 text-lg mb-2">Failed to load messages</p>
                <p className="text-slate-400 text-sm text-center">
                    {error?.response?.data?.message || 'An error occurred. Please try again.'}
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 flex flex-col gap-5 custom-scrollbar bg-[#1A1A1A]">
            {orderedMessages.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-full gap-4">
                    <div className="w-16 h-16 rounded-full bg-[#2C2C2C] flex items-center justify-center border border-[#3A3A3A]">
                        <span className="material-symbols-outlined text-3xl text-slate-500">forum</span>
                    </div>
                    <p className="text-slate-400 text-sm font-medium">No messages yet</p>
                    <p className="text-slate-500 text-xs max-w-[200px] text-center">Send a message below to start the conversation.</p>
                </div>
            ) : (
                orderedMessages.map((message) => {
                    const isOwnMessage = message.sender?.id === user?.id;
                    const isDeleted = !!message.is_deleted;
                    const isEditing = editingMessageId === message.id;
                    const menuOpen = openMenuMessageId === message.id;
                    return (
                        <div
                            key={message.id}
                            className={`flex items-start space-x-3 w-full min-w-0 max-w-full ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}
                        >
                            <Avatar
                                src={message.sender?.profile_picture}
                                alt={message.sender?.name}
                                size="sm"
                            />
                            <div className={`flex flex-col max-w-xs lg:max-w-md ${isOwnMessage ? 'items-end' : 'items-start'} relative`} ref={menuOpen ? menuRef : null}>
                                {!isOwnMessage && (
                                    <p className="text-xs font-medium text-primary mb-0.5">
                                        {getSenderDisplayName(message.sender?.id) || message.sender?.name || 'Unknown'}
                                    </p>
                                )}
                                {isEditing ? (
                                    <div className="rounded-xl px-4 py-3 bg-[#2C2C2C] border border-[#3A3A3A] min-w-[280px]">
                                        <textarea
                                            value={editingText}
                                            onChange={(e) => setEditingText(e.target.value)}
                                            placeholder="Edit your message..."
                                            rows={3}
                                            className="w-full bg-[#1A1A1A] border border-[#3A3A3A] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-500 resize-none"
                                        />
                                        <div className="mt-3 flex items-center gap-2">
                                            <input ref={editFileInputRef} type="file" accept="image/*,video/*" onChange={handleEditFileChange} className="hidden" />
                                            <button
                                                type="button"
                                                onClick={() => editFileInputRef.current?.click()}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-primary hover:bg-white/5 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-base">attach_file</span>
                                                Replace attachment
                                            </button>
                                        </div>
                                        {editingMediaPreview && (
                                            <div className="mt-3 rounded-xl overflow-hidden bg-black/20">
                                                {editingMediaFile?.type?.startsWith('video/') || message.attachment_type === 'video' ? (
                                                    <video src={editingMediaPreview} controls className="rounded-lg max-h-40 w-full" />
                                                ) : (
                                                    <img src={editingMediaPreview} alt="Preview" className="rounded-lg max-h-40 w-full object-cover" />
                                                )}
                                            </div>
                                        )}
                                        <div className="mt-4 flex items-center justify-end gap-2">
                                            <button type="button" onClick={cancelEdit} className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--theme-border)] text-slate-300 hover:bg-slate-600 transition-colors">
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => submitEdit(message.id)}
                                                disabled={updateMutation.isPending || (!editingText.trim() && !editingMediaFile)}
                                                className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-white hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                                            >
                                                {updateMutation.isPending ? <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span> : <span className="material-symbols-outlined text-lg">check</span>}
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="relative group rounded-lg">
                                            <div className={`rounded-2xl transition-all duration-200 overflow-hidden w-full max-w-[min(85%,360px)] min-w-0 ${isOwnMessage ? 'bg-primary text-white rounded-br-none' : 'bg-[#2C2C2C] text-white rounded-bl-none border-l border-slate-600/60'}`}>
                                                {!isDeleted && message.attachment_url && (
                                                    <>
                                                        <div className="p-1.5 bg-black/10">
                                                            {message.attachment_type === 'video' ? (
                                                                <video src={message.attachment_url} controls className="rounded-lg w-full max-h-72 object-contain" />
                                                            ) : (
                                                                <a href={message.attachment_url} target="_blank" rel="noopener noreferrer" className="block">
                                                                    <img src={message.attachment_url} alt="Shared" className="rounded-lg w-full max-h-72 object-contain bg-black/20" />
                                                                </a>
                                                            )}
                                                        </div>
                                                        {message.content ? (
                                                            <p className="px-4 pb-3 pt-3 text-sm text-white/95 leading-relaxed whitespace-pre-wrap break-words break-all border-t border-[#3A3A3A] mt-1 mx-2">{message.content}</p>
                                                        ) : (
                                                            <div className="pb-2" />
                                                        )}
                                                    </>
                                                )}
                                                {!isDeleted && !message.attachment_url && message.content && (
                                                    <div className="px-4 py-3">
                                                        <p className="text-sm text-white leading-relaxed whitespace-pre-wrap break-words break-all">{message.content}</p>
                                                    </div>
                                                )}
                                                {isDeleted && (
                                                    <div className="px-4 py-3">
                                                        <p className="text-sm italic text-white/90">{isOwnMessage ? 'You deleted this message' : 'This message was deleted'}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className={`flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-400 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                            <span>{formatMessageTime(message.created_at)}{message.edited_at && !isDeleted ? ' · edited' : ''}</span>
                                            {isOwnMessage && !isDeleted && (
                                                <div className="relative" ref={menuOpen ? menuRef : null}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setOpenMenuMessageId(menuOpen ? null : message.id)}
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${menuOpen ? 'bg-white/10 text-slate-200' : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'}`}
                                                        aria-label="Message options"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                                                    </button>
                                                    {menuOpen && (
                                                        <>
                                                            <div className="fixed inset-0 z-10" onClick={() => setOpenMenuMessageId(null)} aria-hidden="true" />
                                                            <div className="message-menu-dropdown absolute bottom-full right-0 mb-1.5 py-1 min-w-[160px] rounded-xl bg-[#252525] border border-[#3A3A3A] z-20 overflow-hidden">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => { setOpenMenuMessageId(null); startEdit(message); }}
                                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-200 hover:bg-white/5 transition-colors text-left"
                                                                >
                                                                    <span className="material-symbols-outlined text-lg text-slate-400">edit</span>
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setOpenMenuMessageId(null)}
                                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-200 hover:bg-white/5 transition-colors text-left"
                                                                >
                                                                    <span className="material-symbols-outlined text-lg text-slate-400">forward</span>
                                                                    Forward
                                                                </button>
                                                                <div className="my-1 border-t border-[#3A3A3A]" />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => confirmDelete(message.id)}
                                                                    disabled={deleteMutation.isPending}
                                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left disabled:opacity-50"
                                                                >
                                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })
            )}
            <div ref={messagesEndRef} />

            <Modal isOpen={!!messageToDelete} onClose={() => setMessageToDelete(null)} title="Delete message?" size="sm">
                <p className="text-slate-300 text-sm mb-6">This message will be removed for everyone in the group. You can't undo this.</p>
                <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => setMessageToDelete(null)} className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--theme-border)] text-slate-300 hover:bg-slate-600 transition-colors">
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={deleteMessage}
                        disabled={deleteMutation.isPending}
                        className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 flex items-center gap-2 transition-colors"
                    >
                        {deleteMutation.isPending ? <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span> : <span className="material-symbols-outlined text-lg">delete</span>}
                        Delete
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default GroupMessageThread;
