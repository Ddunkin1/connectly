import React, { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDeleteMessage, useMessages, useUpdateMessage, useSendMessage, usePinMessage, useUnpinMessage } from '../../hooks/useMessages';
import { useConversations } from '../../hooks/useConversations';
import { getEcho } from '../../echo';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';
import { formatDate } from '../../utils/formatDate';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

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

const MessageThread = ({ conversationId, onMediaFromMessages, onPinnedFromMessages }) => {
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
    const [hiddenMessageIds, setHiddenMessageIds] = useState([]);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
    const [imageMenuOpen, setImageMenuOpen] = useState(false);
    const [forwardModalOpen, setForwardModalOpen] = useState(false);
    const [forwardMessageId, setForwardMessageId] = useState(null);
    const menuRef = useRef(null);
    const imageMenuRef = useRef(null);
    const { data: conversationsData } = useConversations();
    const sendMessageMutation = useSendMessage();
    const pinMessageMutation = usePinMessage();
    const unpinMessageMutation = useUnpinMessage();
    const conversations = conversationsData?.pages?.flatMap((p) => p?.data?.conversations || []) || [];

    const messages = data?.pages.flatMap((page) => page.data.messages).reverse() || [];
    const visibleMessages = messages.filter((m) => !hiddenMessageIds.includes(m.id));

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

    // Extract media for right panel (stable deps to avoid infinite loop: messages is a new array each render)
    const mediaForPanel = messages.filter((m) => m.attachment_url).map((m) => ({
        id: m.id,
        attachment_url: m.attachment_url,
        attachment_type: m.attachment_type || 'image',
    }));
    const mediaDeps = mediaForPanel.length + mediaForPanel.map((m) => m.id).join(',');
    useEffect(() => {
        if (onMediaFromMessages) {
            onMediaFromMessages(mediaForPanel);
        }
    }, [mediaDeps, onMediaFromMessages]); // eslint-disable-line react-hooks/exhaustive-deps -- mediaForPanel derived from mediaDeps

    // Derive pinned messages for right panel (local, per-session)
    const pinnedForPanel = messages
        .filter((m) => m.is_pinned && !m.is_deleted)
        .map((m) => ({
            id: m.id,
            title:
                m.message ||
                (m.attachment_url
                    ? m.attachment_type === 'video'
                        ? '🎬 Video'
                        : m.attachment_type === 'file'
                            ? '📎 File'
                            : '📷 Photo'
                    : 'Pinned message'),
            meta: formatMessageTime(m.created_at),
        }));
    const pinnedDeps = pinnedForPanel.length + pinnedForPanel.map((p) => p.id).join(',');
    useEffect(() => {
        if (!onPinnedFromMessages) return;
        // Attach scroll handlers lazily so callbacks don't break serialization
        const itemsWithHandlers = pinnedForPanel.map((item) => ({
            ...item,
            onClick: () => {
                const el = messagesContainerRef.current?.querySelector?.(
                    `[data-message-id=\"${item.id}\"]`
                );
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            },
        }));
        onPinnedFromMessages(itemsWithHandlers);
    }, [pinnedDeps, onPinnedFromMessages]); // eslint-disable-line react-hooks/exhaustive-deps

    // Subscribe to real-time messages via Reverb
    useEffect(() => {
        if (!conversationId) return;
        const echo = getEcho();
        if (!echo) return;

        const channel = echo.private(`conversation.${conversationId}`);
        channel.listen('.MessageSent', (payload) => {
            const newMessage = payload?.message;
            if (!newMessage) return;
            // Skip regular messages from current user (added optimistically) — but always show call records
            const currentUser = useAuthStore.getState().user;
            if (newMessage.sender?.id === currentUser?.id && newMessage.type !== 'call') return;

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

        // Mark all own sent messages as read when the other person reads them
        channel.listen('.MessagesRead', (payload) => {
            const currentUser = useAuthStore.getState().user;
            if (payload?.readerId === currentUser?.id) return; // we read them, not them
            queryClient.setQueryData(['messages', conversationId], (old) => {
                if (!old?.pages?.length) return old;
                return {
                    ...old,
                    pages: old.pages.map((page) => ({
                        ...page,
                        data: {
                            ...page.data,
                            messages: (page.data?.messages ?? []).map((m) =>
                                m.sender?.id === currentUser?.id ? { ...m, is_read: true } : m
                            ),
                        },
                    })),
                };
            });
        });

        return () => {
            channel.stopListening('.MessageSent');
            channel.stopListening('.MessageUpdated');
            channel.stopListening('.MessageDeleted');
            channel.stopListening('.MessagesRead');
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
        setForwardMessageId(null);
        setForwardModalOpen(true);
    };

    const openForwardMessageModal = (message) => {
        setOpenMenuMessageId(null);
        setForwardMessageId(message.id);
        setForwardModalOpen(true);
    };

    const handleForwardMessage = async (conversation) => {
        const msg = messages.find((m) => m.id === forwardMessageId);
        if (!msg || !conversation?.other_user?.id) return;
        setForwardModalOpen(false);
        setForwardMessageId(null);
        try {
            await sendMessageMutation.mutateAsync({
                receiver_id: conversation.other_user.id,
                message: msg.message || '',
            });
            toast.success(`Forwarded to ${conversation.other_user.name || conversation.other_user.username}`);
        } catch {
            toast.error('Failed to forward');
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

    const hideMessageForMe = (messageId) => {
        setHiddenMessageIds((prev) => (prev.includes(messageId) ? prev : [...prev, messageId]));
        setMessageToDelete(null);
        toast.success('Message deleted for you.');
    };

    const deleteMessageForEveryone = async () => {
        if (!messageToDelete) return;
        try {
            await deleteMessageMutation.mutateAsync(messageToDelete);
            setMessageToDelete(null);
        } catch {
            // Toast handled by hook
        }
    };

    const togglePin = (message) => {
        const messageId = message.id;
        const isPinned = !!message.is_pinned;
        const mutate = isPinned ? unpinMessageMutation : pinMessageMutation;
        mutate
            .mutateAsync(messageId)
            .catch(() => {
                // toast handled in hook
            })
            .finally(() => {
                setOpenMenuMessageId(null);
            });
    };

    // Close message menu when clicking outside
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
                <p className="text-gray-500 text-sm text-center">
                    {error?.response?.data?.message || 'An error occurred while loading messages. Please try again.'}
                </p>
            </div>
        );
    }

    // Group messages by date for separators (only visible messages)
    const grouped = [];
    let lastDateKey = null;
    visibleMessages.forEach((msg) => {
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
            className="flex-1 min-h-0 overflow-y-auto px-5 py-5 flex flex-col gap-5 custom-scrollbar bg-[var(--theme-bg-main)]"
        >
            {isFetchingNextPage && (
                <div className="flex items-center justify-center gap-2 py-4 shrink-0">
                    <LoadingSpinner size="sm" />
                    <span className="text-xs text-[var(--text-primary)]/60">Loading older messages...</span>
                </div>
            )}
            {messages.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-full gap-4">
                    <div className="w-16 h-16 rounded-full bg-[var(--theme-surface)] flex items-center justify-center border border-[var(--theme-border)]">
                        <span className="material-symbols-outlined text-3xl text-[var(--text-primary)]/60">chat_bubble_outline</span>
                    </div>
                    <p className="text-[var(--text-primary)]/80 text-sm font-medium">No messages yet</p>
                    <p className="text-[var(--text-primary)]/60 text-xs max-w-[200px] text-center">Send a message below to start the conversation.</p>
                </div>
            ) : (
                grouped.map((item, idx) => {
                    if (item.type === 'separator') {
                        return (
                            <div key={`sep-${idx}`} className="flex flex-col items-center my-4">
                                <span className="px-4 py-2 bg-[var(--theme-surface)] text-[10px] font-semibold text-[var(--text-primary)]/70 rounded-full uppercase tracking-widest">
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
                    const isPinned = !!message.is_pinned;

                    // ── Call system messages ──────────────────────────────────
                    if (message.type === 'call') {
                        const raw         = message.message ?? '';
                        const parts       = raw.split(':');
                        const kind        = parts[0]; // 'call_missed' | 'call_ended'
                        const isMissed    = kind === 'call_missed';
                        const duration    = isMissed ? 0 : parseInt(parts[1] ?? '0', 10);
                        const initiatorId = parseInt(parts[isMissed ? 1 : 2] ?? '0', 10);
                        const iWasCaller  = initiatorId === user?.id;
                        const mins        = Math.floor(duration / 60);
                        const secs        = duration % 60;
                        const durationText = duration > 0
                            ? ` · ${mins > 0 ? `${mins}m ` : ''}${secs}s`
                            : '';

                        let label, icon;
                        if (isMissed) {
                            label = iWasCaller ? 'You called' : 'Missed call';
                            icon  = iWasCaller ? 'call_made' : 'missed_video_call';
                        } else {
                            label = `Call ended${durationText}`;
                            icon  = 'videocam';
                        }

                        return (
                            <div key={message.id} className="flex justify-center my-1">
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium
                                    ${isMissed
                                        ? (iWasCaller ? 'bg-[var(--theme-surface)] text-[var(--text-primary)]/60' : 'bg-red-500/10 text-red-400')
                                        : 'bg-green-500/10 text-green-400'}`}
                                >
                                    <span className="material-symbols-outlined text-base">{icon}</span>
                                    {label}
                                    <span className="opacity-50 ml-1">
                                        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={message.id}
                            data-message-id={message.id}
                            className={`flex items-end gap-3 w-full max-w-[94%] min-w-0 ${
                                isOwnMessage ? 'self-end flex-row-reverse' : ''
                            }`}
                        >
                            {!isOwnMessage && (
                                <img src={message.sender?.profile_picture} alt={message.sender?.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                            )}
                            <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} relative`} ref={menuOpen ? menuRef : null}>
                                {isEditing ? (
                                    <div className="p-4 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] w-full min-w-[280px]">
                                        <textarea
                                            value={editingText}
                                            onChange={(e) => setEditingText(e.target.value)}
                                            placeholder="Edit your message..."
                                            className="w-full bg-[var(--theme-bg-main)] border border-[var(--theme-border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/50 focus:outline-none focus:border-[var(--theme-accent)] resize-none"
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
                                            <button
                                                type="button"
                                                onClick={cancelEdit}
                                                className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--theme-border)] text-[var(--text-primary)] hover:opacity-80 transition-colors"
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
                                            <div className={`rounded-2xl transition-all duration-200 overflow-hidden w-full max-w-[520px] min-w-[100px] shadow-md ${
                                                isOwnMessage
                                                    ? 'bg-primary/15 text-[var(--text-primary)] rounded-br-none border border-primary/25'
                                                    : 'bg-[var(--theme-surface)] text-[var(--text-primary)] rounded-bl-none border border-[var(--theme-border)]'
                                            }`}>
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
                                                        {message.message ? (
                                                            <p className="px-4 pb-3 pt-3 text-sm text-[var(--text-primary)]/95 leading-relaxed whitespace-pre-wrap break-words break-all border-t border-[var(--theme-border)] mt-1 mx-2">{message.message}</p>
                                                        ) : (
                                                            <div className="pb-1.5" />
                                                        )}
                                                    </>
                                                )}
                                                {!isDeleted && !message.attachment_url && message.message && (
                                                    <div className="px-4 py-3 min-w-0 max-w-full">
                                                        <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap break-words">{message.message}</p>
                                                    </div>
                                                )}
                                                {isDeleted && (
                                                    <div className="px-4 py-3">
                                                        <p className="text-sm italic text-[var(--text-primary)]/90">
                                                            {isOwnMessage ? 'You deleted this message' : 'This message was deleted'}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className={`flex items-center gap-1.5 mt-1.5 text-[11px] text-[var(--text-primary)]/60 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                            <span>
                                                {formatMessageTime(message.created_at)}
                                                {message.edited_at && !isDeleted ? ' · edited' : ''}
                                                {isPinned && !isDeleted ? ' · Pinned' : ''}
                                            </span>
                                            {isOwnMessage && (
                                                <span
                                                    className={`material-symbols-outlined text-[14px] transition-colors ${message.is_read ? 'text-[var(--theme-accent)]' : 'text-[var(--text-primary)]/40'}`}
                                                    title={message.is_read ? 'Seen' : 'Delivered'}
                                                    aria-hidden
                                                >
                                                    {message.is_read ? 'done_all' : 'done'}
                                                </span>
                                            )}
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
                                                            <div className="message-menu-dropdown absolute bottom-full right-0 mb-1.5 py-1 min-w-[180px] rounded-xl bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] z-20 overflow-hidden shadow-lg">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => togglePin(message)}
                                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--theme-surface)] transition-colors text-left"
                                                                >
                                                                    <span className="material-symbols-outlined text-lg text-[var(--text-primary)]/70">
                                                                        {isPinned ? 'bookmark_remove' : 'bookmark_add'}
                                                                    </span>
                                                                    {isPinned ? 'Unpin message' : 'Pin message'}
                                                                </button>
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
                                                                    onClick={() => openForwardMessageModal(message)}
                                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--theme-surface)] transition-colors text-left"
                                                                >
                                                                    <span className="material-symbols-outlined text-lg text-[var(--text-primary)]/70">forward</span>
                                                                    Forward
                                                                </button>
                                                                <div className="my-1 border-t border-[var(--theme-border)]" />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => confirmDelete(message.id)}
                                                                    disabled={deleteMessageMutation.isPending}
                                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left disabled:opacity-50"
                                                                >
                                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                                    Delete…
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
                {(() => {
                    const msg = messages.find((m) => m.id === messageToDelete);
                    const isOwn = msg?.sender?.id === user?.id;
                    return (
                        <>
                            <p className="text-[var(--text-primary)]/90 text-sm mb-6">
                                {isOwn
                                    ? 'Choose how you want to delete this message.'
                                    : 'This message will be removed from your view only.'}
                            </p>
                            <div className="flex flex-col sm:flex-row justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => hideMessageForMe(messageToDelete)}
                                    className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--theme-surface)] text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] transition-colors"
                                >
                                    Delete for me
                                </button>
                                {isOwn && (
                                    <button
                                        type="button"
                                        onClick={deleteMessageForEveryone}
                                        disabled={deleteMessageMutation.isPending}
                                        className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 flex items-center gap-2 transition-colors"
                                    >
                                        {deleteMessageMutation.isPending ? (
                                            <span className="material-symbols-outlined text-lg animate-spin">
                                                progress_activity
                                            </span>
                                        ) : (
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        )}
                                        Delete for everyone
                                    </button>
                                )}
                            </div>
                        </>
                    );
                })()}
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

            <Modal isOpen={forwardModalOpen} onClose={() => { setForwardModalOpen(false); setForwardMessageId(null); }} title="Forward to" size="sm">
                <div className="max-h-64 overflow-y-auto space-y-1">
                    {conversations
                        .filter((c) => c.id !== conversationId)
                        .map((c) => (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => forwardMessageId ? handleForwardMessage(c) : handleForwardImage(c)}
                                disabled={sendMessageMutation.isPending}
                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--theme-surface-hover)] transition-colors text-left disabled:opacity-50"
                            >
                                <img src={c.other_user?.profile_picture} alt="" className="w-10 h-10 rounded-full object-cover" />
                                <span className="text-sm font-medium text-[var(--text-primary)]">{c.other_user?.name || c.other_user?.username}</span>
                            </button>
                        ))}
                    {conversations.filter((c) => c.id !== conversationId).length === 0 && (
                        <p className="text-sm text-[var(--text-primary)]/60 py-4 text-center">No other conversations</p>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default MessageThread;
