import React, { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDeleteMessage, useMessages, useUpdateMessage } from '../../hooks/useMessages';
import { getEcho } from '../../echo';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';
import { formatDate } from '../../utils/formatDate';
import useAuthStore from '../../store/authStore';

const formatDateSeparator = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'TODAY';
    if (d.toDateString() === yesterday.toDateString()) return 'YESTERDAY';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
};

const formatMessageTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

const MessageThread = ({ conversationId, onMediaFromMessages }) => {
    const user = useAuthStore((state) => state.user);
    const queryClient = useQueryClient();
    const updateMessageMutation = useUpdateMessage();
    const deleteMessageMutation = useDeleteMessage();
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        error,
        isError,
    } = useMessages(conversationId);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const scrollRestoreRef = useRef(null);
    const prevFetchingNextRef = useRef(false);
    const editFileInputRef = useRef(null);
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editingText, setEditingText] = useState('');
    const [editingMediaFile, setEditingMediaFile] = useState(null);
    const [editingMediaPreview, setEditingMediaPreview] = useState(null);
    const [openMenuMessageId, setOpenMenuMessageId] = useState(null);
    const [messageToDelete, setMessageToDelete] = useState(null);
    const menuRef = useRef(null);

    const messages = data?.pages.flatMap((page) => page.data.messages).reverse() || [];

    const patchMessageInCache = (patchedMessage) => {
        if (!patchedMessage) return;
        queryClient.setQueryData(['messages', conversationId], (old) => {
            if (!old?.pages?.length) return old;
            const pages = old.pages.map((page) => {
                const existing = page?.data?.messages || [];
                return {
                    ...page,
                    data: {
                        ...page.data,
                        messages: existing.map((m) => (m.id === patchedMessage.id ? { ...m, ...patchedMessage } : m)),
                    },
                };
            });
            return { ...old, pages };
        });
    };

    // Extract media for right panel
    useEffect(() => {
        if (onMediaFromMessages) {
            const media = messages.filter((m) => m.attachment_url).map((m) => ({
                id: m.id,
                attachment_url: m.attachment_url,
                attachment_type: m.attachment_type || 'image',
            }));
            onMediaFromMessages(media);
        }
    }, [messages, onMediaFromMessages]);

    // Subscribe to real-time messages via Reverb
    useEffect(() => {
        if (!conversationId) return;
        const echo = getEcho();
        if (!echo) return;

        const channel = echo.private(`conversation.${conversationId}`);
        channel.listen('.MessageSent', (payload) => {
            const newMessage = payload?.message;
            if (!newMessage) return;
            // Skip if from current user (added optimistically from send response)
            const currentUser = useAuthStore.getState().user;
            if (newMessage.sender?.id === currentUser?.id) return;

            queryClient.setQueryData(['messages', conversationId], (old) => {
                if (!old?.pages?.length) {
                    queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
                    return old;
                }
                const pages = [...old.pages];
                const firstPage = pages[0];
                if (firstPage?.data?.messages) {
                    const exists = firstPage.data.messages.some((m) => m.id === newMessage.id);
                    if (!exists) {
                        pages[0] = {
                            ...firstPage,
                            data: {
                                ...firstPage.data,
                                messages: [newMessage, ...firstPage.data.messages],
                            },
                        };
                    }
                }
                return { ...old, pages };
            });

            // Refresh conversation list so unread badge and order update
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        });
        channel.listen('.MessageUpdated', (payload) => {
            patchMessageInCache(payload?.message);
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        });
        channel.listen('.MessageDeleted', (payload) => {
            patchMessageInCache(payload?.message);
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        });

        return () => {
            channel.stopListening('.MessageSent');
            channel.stopListening('.MessageUpdated');
            channel.stopListening('.MessageDeleted');
            echo.leave(`conversation.${conversationId}`);
        };
    }, [conversationId, queryClient]);

    // Reset initial scroll when switching conversation
    const hasScrolledInitialRef = useRef(false);
    useEffect(() => {
        hasScrolledInitialRef.current = false;
    }, [conversationId]);

    // On first load, scroll to bottom so newer messages are visible first
    useEffect(() => {
        if (!conversationId || messages.length === 0 || isLoading) return;
        if (!hasScrolledInitialRef.current) {
            hasScrolledInitialRef.current = true;
            requestAnimationFrame(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
            });
        }
    }, [conversationId, messages.length, isLoading]);

    // When a new message is added (send or real-time), scroll to bottom; don't when loading older
    const lastNewestMessageIdRef = useRef(null);
    useEffect(() => {
        if (messages.length === 0) return;
        const newestId = messages[messages.length - 1]?.id;
        if (newestId !== lastNewestMessageIdRef.current) {
            lastNewestMessageIdRef.current = newestId;
            if (hasScrolledInitialRef.current) {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
        }
    }, [messages]);

    // Handle scroll for infinite loading (older messages at top)
    const handleScroll = () => {
        const el = messagesContainerRef.current;
        if (!el) return;
        const { scrollTop, scrollHeight } = el;
        if (scrollTop <= 100 && hasNextPage && !isFetchingNextPage) {
            scrollRestoreRef.current = { scrollHeight, scrollTop };
            fetchNextPage();
        }
    };

    // Restore scroll position after older messages are prepended
    useEffect(() => {
        const wasFetching = prevFetchingNextRef.current;
        prevFetchingNextRef.current = isFetchingNextPage;
        const el = messagesContainerRef.current;
        if (wasFetching && !isFetchingNextPage && el && scrollRestoreRef.current) {
            const { scrollHeight: oldHeight, scrollTop: oldTop } = scrollRestoreRef.current;
            scrollRestoreRef.current = null;
            requestAnimationFrame(() => {
                if (!el) return;
                const newHeight = el.scrollHeight;
                el.scrollTop = Math.max(0, newHeight - oldHeight + oldTop);
            });
        }
    }, [isFetchingNextPage]);

    const startEdit = (message) => {
        setEditingMessageId(message.id);
        setEditingText(message.message || '');
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
        payload.append('message', editingText);
        if (editingMediaFile) {
            payload.append('media', editingMediaFile);
        }

        try {
            await updateMessageMutation.mutateAsync({ messageId, data: payload });
            cancelEdit();
        } catch {
            // Toast handled by hook
        }
    };

    const confirmDelete = (messageId) => {
        setOpenMenuMessageId(null);
        setMessageToDelete(messageId);
    };

    const deleteMessage = async () => {
        if (!messageToDelete) return;
        try {
            await deleteMessageMutation.mutateAsync(messageToDelete);
            setMessageToDelete(null);
        } catch {
            // Toast handled by hook
        }
    };

    // Close message menu when clicking outside
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
                <p className="text-gray-500 text-sm text-center">
                    {error?.response?.data?.message || 'An error occurred while loading messages. Please try again.'}
                </p>
            </div>
        );
    }

    // Group messages by date for separators
    const grouped = [];
    let lastDateKey = null;
    messages.forEach((msg) => {
        const dateKey = msg.created_at ? new Date(msg.created_at).toDateString() : '';
        if (dateKey && dateKey !== lastDateKey) {
            grouped.push({ type: 'separator', date: msg.created_at });
            lastDateKey = dateKey;
        }
        grouped.push({ type: 'message', data: msg });
    });

    return (
        <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 min-h-0 overflow-y-auto px-5 py-5 flex flex-col gap-5 custom-scrollbar bg-[#1A1A1A]"
        >
            {isFetchingNextPage && (
                <div className="flex items-center justify-center gap-2 py-4 shrink-0">
                    <LoadingSpinner size="sm" />
                    <span className="text-xs text-slate-400">Loading older messages...</span>
                </div>
            )}
            {messages.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-full gap-4">
                    <div className="w-16 h-16 rounded-full bg-[#2C2C2C] flex items-center justify-center border border-[#3A3A3A]">
                        <span className="material-symbols-outlined text-3xl text-slate-500">chat_bubble_outline</span>
                    </div>
                    <p className="text-slate-400 text-sm font-medium">No messages yet</p>
                    <p className="text-slate-500 text-xs max-w-[200px] text-center">Send a message below to start the conversation.</p>
                </div>
            ) : (
                grouped.map((item, idx) => {
                    if (item.type === 'separator') {
                        return (
                            <div key={`sep-${idx}`} className="flex flex-col items-center my-4">
                                <span className="px-4 py-2 bg-[#2C2C2C] text-[10px] font-semibold text-slate-400 rounded-full uppercase tracking-widest">
                                    {formatDateSeparator(item.date)}
                                </span>
                            </div>
                        );
                    }
                    const message = item.data;
                    const isOwnMessage = message.sender?.id === user?.id;
                    const isDeleted = !!message.is_deleted;
                    const isEditing = editingMessageId === message.id;
                    const menuOpen = openMenuMessageId === message.id;
                    return (
                        <div key={message.id} className={`flex items-end gap-3 w-full max-w-[85%] min-w-0 ${isOwnMessage ? 'self-end flex-row-reverse' : ''}`}>
                            {!isOwnMessage && (
                                <img src={message.sender?.profile_picture} alt={message.sender?.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                            )}
                            <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} relative`} ref={menuOpen ? menuRef : null}>
                                {isEditing ? (
                                    <div className="p-4 rounded-2xl bg-[#2C2C2C] border border-[#3A3A3A] w-full min-w-[280px]">
                                        <textarea
                                            value={editingText}
                                            onChange={(e) => setEditingText(e.target.value)}
                                            placeholder="Edit your message..."
                                            className="w-full bg-[#1A1A1A] border border-[#3A3A3A] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-500 resize-none"
                                            rows={3}
                                        />
                                        <div className="mt-3 flex items-center gap-2">
                                            <input
                                                ref={editFileInputRef}
                                                type="file"
                                                accept="image/*,video/*"
                                                onChange={handleEditFileChange}
                                                className="hidden"
                                            />
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
                                            <button
                                                type="button"
                                                onClick={cancelEdit}
                                                className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--theme-border)] text-slate-300 hover:bg-slate-600 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => submitEdit(message.id)}
                                                disabled={updateMessageMutation.isPending || (!editingText.trim() && !editingMediaFile)}
                                                className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                                            >
                                                {updateMessageMutation.isPending ? (
                                                    <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                                                ) : (
                                                    <span className="material-symbols-outlined text-lg">check</span>
                                                )}
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className={`relative group rounded-2xl ${isOwnMessage ? 'rounded-br-none' : 'rounded-bl-none'}`}>
                                            <div className={`rounded-2xl transition-all duration-200 overflow-hidden w-full max-w-[min(85%,360px)] min-w-0 ${
                                                isOwnMessage
                                                    ? 'bg-primary text-white rounded-br-none'
                                                    : 'bg-[#2C2C2C] text-white rounded-bl-none border-l border-slate-600/60'
                                            }`}>
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
                                                        {message.message ? (
                                                            <p className="px-4 pb-3 pt-3 text-sm text-white/95 leading-relaxed whitespace-pre-wrap break-words break-all border-t border-[#3A3A3A] mt-1 mx-2">{message.message}</p>
                                                        ) : (
                                                            <div className="pb-2" />
                                                        )}
                                                    </>
                                                )}
                                                {!isDeleted && !message.attachment_url && message.message && (
                                                    <div className="px-4 py-3 min-w-0">
                                                        <p className="text-sm text-white leading-relaxed whitespace-pre-wrap break-words break-all">{message.message}</p>
                                                    </div>
                                                )}
                                                {isDeleted && (
                                                    <div className="px-4 py-3">
                                                        <p className="text-sm italic text-white/90">
                                                            {isOwnMessage ? 'You deleted this message' : 'This message was deleted'}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className={`flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-400 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                            <span>{formatMessageTime(message.created_at)}{message.edited_at && !isDeleted ? ' · edited' : ''}</span>
                                            {isOwnMessage && <span className="material-symbols-outlined text-[14px]" aria-hidden>done_all</span>}
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
                                                                    onClick={() => { setOpenMenuMessageId(null); /* TODO: forward */ }}
                                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-200 hover:bg-white/5 transition-colors text-left"
                                                                >
                                                                    <span className="material-symbols-outlined text-lg text-slate-400">forward</span>
                                                                    Forward
                                                                </button>
                                                                <div className="my-1 border-t border-[#3A3A3A]" />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => confirmDelete(message.id)}
                                                                    disabled={deleteMessageMutation.isPending}
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

            <Modal
                isOpen={!!messageToDelete}
                onClose={() => setMessageToDelete(null)}
                title="Delete message?"
                size="sm"
            >
                <p className="text-slate-300 text-sm mb-6">This message will be removed for everyone in the chat. You can't undo this.</p>
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => setMessageToDelete(null)}
                        className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--theme-border)] text-slate-300 hover:bg-slate-600 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={deleteMessage}
                        disabled={deleteMessageMutation.isPending}
                        className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 flex items-center gap-2 transition-colors"
                    >
                        {deleteMessageMutation.isPending ? (
                            <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                        ) : (
                            <span className="material-symbols-outlined text-lg">delete</span>
                        )}
                        Delete
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default MessageThread;
