import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import { useConversations } from '../../hooks/useConversations';
import { useSendMessage } from '../../hooks/useMessages';
import toast from 'react-hot-toast';

const ShareViaMessageModal = ({ post, onClose, onSent, initialReceiver }) => {
    const [selectedUser, setSelectedUser] = useState(initialReceiver ?? null);
    useEffect(() => {
        setSelectedUser(initialReceiver ?? null);
    }, [initialReceiver]);
    const { data, isLoading } = useConversations();
    const sendMessageMutation = useSendMessage();
    const { register, handleSubmit } = useForm({
        defaultValues: { message: 'Check out this post!' },
    });

    const conversations = data?.pages?.flatMap((p) => p.data?.conversations ?? []) ?? [];

    const onSubmit = (data) => {
        if (!selectedUser?.id) {
            toast.error('Select a user to send to');
            return;
        }
        sendMessageMutation.mutate(
            { receiver_id: selectedUser.id, message: data.message?.trim() || null, post_id: post.id },
            {
                onSuccess: () => {
                    toast.success(`Sent to ${selectedUser.name}`);
                    onSent?.();
                    onClose();
                },
                onError: (err) => {
                    toast.error(err.response?.data?.message || 'Failed to send');
                },
            }
        );
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Share post via message"
        >
            <div
                className="bg-[var(--theme-surface)] rounded-xl shadow-xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col border border-[var(--theme-border)]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 border-b border-[var(--theme-border)] flex items-center justify-between shrink-0">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">Send to someone</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-[var(--theme-surface-hover)] text-[var(--text-secondary)]"
                        aria-label="Close"
                    >
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
                    <div className="p-4 flex-1 overflow-y-auto space-y-4">
                        <p className="text-sm text-[var(--text-secondary)]">Choose who to send this post to:</p>

                        {isLoading ? (
                            <div className="flex justify-center py-6">
                                <LoadingSpinner size="sm" />
                            </div>
                        ) : conversations.length === 0 ? (
                            <p className="text-sm text-[var(--text-secondary)] py-4">No conversations yet. Start a chat from Messages.</p>
                        ) : (
                            <ul className="space-y-1 max-h-48 overflow-y-auto">
                                {conversations.map((conv) => {
                                    const other = conv.other_user;
                                    if (!other) return null;
                                    const isSelected = selectedUser?.id === other.id;
                                    return (
                                        <li key={conv.id}>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedUser(other)}
                                                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                                                    isSelected
                                                        ? 'bg-[var(--theme-accent)]/15 ring-1 ring-[var(--theme-accent)]'
                                                        : 'hover:bg-[var(--theme-surface-hover)]'
                                                }`}
                                            >
                                                <Avatar src={other.profile_picture} alt={other.name} size="sm" className="w-10 h-10 shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium text-[var(--text-primary)] truncate">{other.name}</p>
                                                    <p className="text-xs text-[var(--text-secondary)] truncate">@{other.username}</p>
                                                </div>
                                                {isSelected && (
                                                    <span className="material-symbols-outlined text-[var(--theme-accent)] text-xl">check_circle</span>
                                                )}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Message (optional)</label>
                            <textarea
                                {...register('message')}
                                placeholder="Add a message..."
                                rows={2}
                                className="w-full px-3 py-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-hover)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:ring-2 focus:ring-[var(--theme-accent)]/40 resize-none text-sm"
                                maxLength={500}
                            />
                            <p className="text-xs text-[var(--text-secondary)] mt-1">The post preview will be included automatically.</p>
                        </div>
                    </div>

                    <div className="p-4 border-t border-[var(--theme-border)] flex justify-end gap-2 shrink-0">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!selectedUser || sendMessageMutation.isPending}
                            loading={sendMessageMutation.isPending}
                        >
                            Send
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ShareViaMessageModal;
