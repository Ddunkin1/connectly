import React, { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDeleteGroupMessage, useGroupConversationWithMessages, useUpdateGroupMessage } from '../../hooks/useGroupConversations';
import { useConversations } from '../../hooks/useConversations';
import { useSendMessage } from '../../hooks/useMessages';
import { getEcho } from '../../echo';
import Avatar from '../common/Avatar';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';
import { formatDate } from '../../utils/formatDate';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

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
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
    const [imageMenuOpen, setImageMenuOpen] = useState(false);
    const [forwardModalOpen, setForwardModalOpen] = useState(false);
    const menuRef = useRef(null);
    const imageMenuRef = useRef(null);
    const { data: conversationsData } = useConversations();
    const sendMessageMutation = useSendMessage();
    const conversations = conversationsData?.pages?.flatMap((p) => p?.data?.conversations || []) || [];

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

    const handleDownloadImage = async () => {
        if (!imagePreviewUrl) return;
        setImageMenuOpen(false);
        try {
            const res = await fetch(imagePreviewUrl);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `image-${Date.now()}.jpg`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Image downloaded');
        } catch {
            toast.error('Download failed');
        }
    };

    const handleForwardImage = async (conversation) => {
        if (!imagePreviewUrl || !conversation?.other_user?.id) return;
        setImageMenuOpen(false);
        setForwardModalOpen(false);
        try {
            const res = await fetch(imagePreviewUrl);
            const blob = await res.blob();
            const file = new File([blob], `image-${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
            const formData = new FormData();
            formData.append('receiver_id', conversation.other_user.id);
            formData.append('message', '');
            formData.append('media', file);
            await sendMessageMutation.mutateAsync(formData);
            setImagePreviewUrl(null);
            toast.success(`Forwarded to ${conversation.other_user.name}`);
        } catch {
            toast.error('Failed to forward');
        }
    };

    const openForwardModal = () => {
        setImageMenuOpen(false);
        setForwardModalOpen(true);
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpenMenuMessageId(null);
            }
            if (imageMenuRef.current && !imageMenuRef.current.contains(e.target)) {
                setImageMenuOpen(false);
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
                <p className="text-[var(--text-primary)]/70 text-sm text-center">
                    {error?.response?.data?.message || 'An error occurred. Please try again.'}
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 flex flex-col gap-5 custom-scrollbar bg-[var(--theme-bg-main)]">
            {orderedMessages.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-full gap-4">
                    <div className="w-16 h-16 rounded-full bg-[var(--theme-surface)] flex items-center justify-center border border-[var(--theme-border)]">
                        <span className="material-symbols-outlined text-3xl text-[var(--text-primary)]/60">forum</span>
                    </div>
                    <p className="text-[var(--text-primary)]/80 text-sm font-medium">No messages yet</p>
                    <p className="text-[var(--text-primary)]/60 text-xs max-w-[200px] text-center">Send a message below to start the conversation.</p>
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
                            <div className={`flex flex-col max-w-[520px] w-full min-w-0 ${isOwnMessage ? 'items-end' : 'items-start'} relative`} ref={menuOpen ? menuRef : null}>
                                {!isOwnMessage && (
                                    <p className="text-xs font-medium text-primary mb-0.5">
                                        {getSenderDisplayName(message.sender?.id) || message.sender?.name || 'Unknown'}
                                    </p>
                                )}
                                {isEditing ? (
                                    <div className="rounded-xl px-4 py-3 bg-[var(--theme-surface)] border border-[var(--theme-border)] min-w-[280px]">
                                        <textarea
                                            value={editingText}
                                            onChange={(e) => setEditingText(e.target.value)}
                                            placeholder="Edit your message..."
                                            rows={3}
                                            className="w-full bg-[var(--theme-bg-main)] border border-[var(--theme-border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/50 focus:outline-none focus:border-[var(--theme-accent)] resize-none"
                                        />
                                        <div className="mt-3 flex items-center gap-2">
                                            <input ref={editFileInputRef} type="file" accept="image/*,video/*" onChange={handleEditFileChange} className="hidden" />
                                            <button
                                                type="button"
                                                onClick={() => editFileInputRef.current?.click()}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-primary)]/70 hover:text-primary hover:bg-[var(--theme-surface-hover)] transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-base">attach_file</span>
                                                Replace attachment
                                            </button>
                                        </div>
                                        {editingMediaPreview && (
                                            <div className="mt-3 rounded-xl overflow-hidden bg-[var(--theme-surface)]/80">
                                                {editingMediaFile?.type?.startsWith('video/') || message.attachment_type === 'video' ? (
                                                    <video src={editingMediaPreview} controls className="rounded-lg max-h-40 w-full" />
                                                ) : (
                                                    <img src={editingMediaPreview} alt="Preview" className="rounded-lg max-h-40 w-full object-cover" />
                                                )}
                                            </div>
                                        )}
                                        <div className="mt-4 flex items-center justify-end gap-2">
                                            <button type="button" onClick={cancelEdit} className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--theme-border)] text-[var(--text-primary)] hover:opacity-80 transition-colors">
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
                                            <div className={`rounded-2xl transition-all duration-200 overflow-hidden w-full max-w-[520px] min-w-[100px] shadow-md ${isOwnMessage ? 'bg-primary/15 text-[var(--text-primary)] rounded-br-none border border-primary/25' : 'bg-[var(--theme-surface)] text-[var(--text-primary)] rounded-bl-none border border-[var(--theme-border)]'}`}>
                                                {!isDeleted && message.attachment_url && (
                                                    <>
                                                        <div className="p-1.5 bg-[var(--theme-bg-main)]/50">
                                                            {message.attachment_type === 'video' ? (
                                                                <video src={message.attachment_url} controls className="rounded-lg w-full max-h-80 object-contain" />
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        setImagePreviewUrl(message.attachment_url);
                                                                    }}
                                                                    className="block w-full text-left cursor-pointer"
                                                                    aria-label="View image"
                                                                >
                                                                    <img src={message.attachment_url} alt="Shared" className="rounded-lg w-full max-h-80 object-contain" />
                                                                </button>
                                                            )}
                                                        </div>
                                                        {message.content ? (
                                                            <p className="px-4 pb-3 pt-3 text-sm text-[var(--text-primary)]/95 leading-relaxed whitespace-pre-wrap break-words border-t border-[var(--theme-border)] mt-1 mx-2">{message.content}</p>
                                                        ) : (
                                                            <div className="pb-1.5" />
                                                        )}
                                                    </>
                                                )}
                                                {!isDeleted && !message.attachment_url && message.content && (
                                                    <div className="px-4 py-3 min-w-0 max-w-full">
                                                        <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                                                    </div>
                                                )}
                                                {isDeleted && (
                                                    <div className="px-4 py-3">
                                                        <p className="text-sm italic text-[var(--text-primary)]/90">{isOwnMessage ? 'You deleted this message' : 'This message was deleted'}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className={`flex items-center gap-1.5 mt-1.5 text-[11px] text-[var(--text-primary)]/60 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                            <span>{formatMessageTime(message.created_at)}{message.edited_at && !isDeleted ? ' · edited' : ''}</span>
                                            {isOwnMessage && !isDeleted && (
                                                <div className="relative" ref={menuOpen ? menuRef : null}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setOpenMenuMessageId(menuOpen ? null : message.id)}
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${menuOpen ? 'bg-[var(--theme-surface-hover)] text-[var(--text-primary)]' : 'text-[var(--text-primary)]/70 hover:text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)]'}`}
                                                        aria-label="Message options"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                                                    </button>
                                                    {menuOpen && (
                                                        <>
                                                            <div className="fixed inset-0 z-10" onClick={() => setOpenMenuMessageId(null)} aria-hidden="true" />
                                                            <div className="message-menu-dropdown absolute bottom-full right-0 mb-1.5 py-1 min-w-[160px] rounded-xl bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] z-20 overflow-hidden shadow-lg">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => { setOpenMenuMessageId(null); startEdit(message); }}
                                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--theme-surface)] transition-colors text-left"
                                                                >
                                                                    <span className="material-symbols-outlined text-lg text-[var(--text-primary)]/70">edit</span>
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setOpenMenuMessageId(null)}
                                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--theme-surface)] transition-colors text-left"
                                                                >
                                                                    <span className="material-symbols-outlined text-lg text-[var(--text-primary)]/70">forward</span>
                                                                    Forward
                                                                </button>
                                                                <div className="my-1 border-t border-[var(--theme-border)]" />
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
                <p className="text-[var(--text-primary)]/90 text-sm mb-6">This message will be removed for everyone in the group. You can't undo this.</p>
                <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => setMessageToDelete(null)} className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--theme-border)] text-[var(--text-primary)] hover:opacity-80 transition-colors">
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

            <Modal isOpen={!!imagePreviewUrl} onClose={() => { setImagePreviewUrl(null); setImageMenuOpen(false); setForwardModalOpen(false); }} size="xl">
                <div className="bg-transparent p-0 -m-6 relative">
                    <img src={imagePreviewUrl || ''} alt="Preview" className="w-full h-auto max-h-[85vh] object-contain rounded-lg" />
                    <div className="absolute top-3 right-3 z-10" ref={imageMenuRef}>
                        <button
                            type="button"
                            onClick={() => setImageMenuOpen((v) => !v)}
                            className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white backdrop-blur-sm shadow-lg"
                            aria-label="Image options"
                        >
                            <span className="material-symbols-outlined text-xl">more_vert</span>
                        </button>
                        {imageMenuOpen && (
                            <div className="absolute right-0 mt-1 py-1 min-w-[180px] rounded-xl bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] shadow-xl z-20">
                                <button
                                    type="button"
                                    onClick={openForwardModal}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--theme-surface)] transition-colors text-left"
                                >
                                    <span className="material-symbols-outlined text-lg text-[var(--text-primary)]/70">forward</span>
                                    Forward
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDownloadImage}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--theme-surface)] transition-colors text-left"
                                >
                                    <span className="material-symbols-outlined text-lg text-[var(--text-primary)]/70">download</span>
                                    Download
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            <Modal isOpen={forwardModalOpen} onClose={() => setForwardModalOpen(false)} title="Forward to" size="sm">
                <div className="max-h-64 overflow-y-auto space-y-1">
                    {conversations.map((c) => (
                        <button
                            key={c.id}
                            type="button"
                            onClick={() => handleForwardImage(c)}
                            disabled={sendMessageMutation.isPending}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--theme-surface-hover)] transition-colors text-left disabled:opacity-50"
                        >
                            <img src={c.other_user?.profile_picture} alt="" className="w-10 h-10 rounded-full object-cover" />
                            <span className="text-sm font-medium text-[var(--text-primary)]">{c.other_user?.name || c.other_user?.username}</span>
                        </button>
                    ))}
                    {conversations.length === 0 && (
                        <p className="text-sm text-[var(--text-primary)]/60 py-4 text-center">No conversations</p>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default GroupMessageThread;
