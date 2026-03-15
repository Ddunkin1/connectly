import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import useAuthStore from '../../store/authStore';
import { useConversations } from '../../hooks/useConversations';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

/**
 * Facebook-style share modal:
 * 1. Share to Feed – inline form (avatar, Feed/Public, say something, Share now)
 * 2. Send to someone – horizontal scroll of contacts
 * 3. Share to – Copy link, etc.
 */
const SharePostModal = ({
    post,
    onClose,
    onShareToTimelineSubmit,
    isShareSubmitting,
    onSendToSomeone,
}) => {
    const user = useAuthStore((state) => state.user);
    const [visibility, setVisibility] = useState('public');
    const { register, handleSubmit, watch } = useForm({ defaultValues: { content: '' } });
    const content = watch('content', '');
    const { data: conversationsData, isLoading: conversationsLoading } = useConversations();
    const conversations = conversationsData?.pages?.flatMap((p) => p.data?.conversations ?? []) ?? [];

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow || '';
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [onClose]);

    const onFeedSubmit = (data) => {
        const formData = new FormData();
        formData.append('content', data.content?.trim() || '');
        formData.append('visibility', visibility);
        formData.append('shared_post_id', String(post.id));
        onShareToTimelineSubmit?.(formData);
    };

    const postUrl = typeof window !== 'undefined' ? `${window.location.origin}/post/${post?.id}` : '';
    const copyLink = () => {
        if (!postUrl) return;
        navigator.clipboard.writeText(postUrl).then(() => toast.success('Link copied'));
    };

    if (!post) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Share post"
        >
            <div
                className="w-full max-w-lg rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--theme-border)] shrink-0">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">Share</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-[var(--theme-surface-hover)] text-[var(--text-secondary)]"
                        aria-label="Close"
                    >
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {/* 1. Share to Feed */}
                    <div className="p-4 border-b border-[var(--theme-border)]">
                        <form onSubmit={handleSubmit(onFeedSubmit)} className="space-y-3">
                            <div className="flex gap-3">
                                <Avatar
                                    src={user?.profile_picture}
                                    alt={user?.name}
                                    className="w-11 h-11 rounded-full shrink-0 ring-2 ring-[var(--theme-accent)]/20"
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium text-[var(--text-primary)]">{user?.name ?? 'You'}</p>
                                    <div className="flex flex-wrap gap-2 mt-1.5">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--theme-surface-hover)] text-[var(--text-secondary)]">
                                            Feed
                                        </span>
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--theme-surface-hover)] text-[var(--text-secondary)] hover:bg-[var(--theme-surface-hover)]/80"
                                            onClick={() => setVisibility(visibility === 'public' ? 'followers' : 'public')}
                                        >
                                            <span className="material-symbols-outlined text-sm">public</span>
                                            {visibility === 'public' ? 'Public' : 'Friends'}
                                            <span className="material-symbols-outlined text-sm">expand_more</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="relative">
                                <textarea
                                    {...register('content')}
                                    placeholder="Say something about this..."
                                    rows={3}
                                    className="w-full px-4 py-3 pr-10 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-hover)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:ring-2 focus:ring-[var(--theme-accent)]/40 focus:border-transparent resize-none text-sm"
                                    maxLength={5000}
                                />
                                <span className="absolute right-3 top-3 text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)]" title="Emoji">
                                    <span className="material-symbols-outlined text-xl">mood</span>
                                </span>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)]">{content.length}/5000</p>
                            <div className="flex justify-end">
                                <Button type="submit" disabled={isShareSubmitting} loading={isShareSubmitting}>
                                    Share now
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* 2. Send to someone */}
                    <div className="p-4 border-b border-[var(--theme-border)]">
                        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Send to someone</h3>
                        {conversationsLoading ? (
                            <div className="flex justify-center py-6">
                                <LoadingSpinner size="sm" />
                            </div>
                        ) : conversations.length === 0 ? (
                            <p className="text-sm text-[var(--text-secondary)]">No conversations yet. Start a chat from Messages.</p>
                        ) : (
                            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 scrollbar-thin scrollbar-thumb-[var(--theme-border)]">
                                {conversations.map((conv) => {
                                    const other = conv.other_user;
                                    if (!other) return null;
                                    return (
                                        <button
                                            key={conv.id}
                                            type="button"
                                            onClick={() => onSendToSomeone?.(other)}
                                            className="flex flex-col items-center gap-1.5 shrink-0 p-2 rounded-xl hover:bg-[var(--theme-surface-hover)] transition-colors min-w-[72px]"
                                        >
                                            <Avatar
                                                src={other.profile_picture}
                                                alt={other.name}
                                                className="w-14 h-14 rounded-full ring-2 ring-[var(--theme-border)]"
                                            />
                                            <span className="text-xs text-[var(--text-primary)] truncate w-full text-center max-w-[72px]">
                                                {other.name?.split(/\s+/)[0] || other.username || 'User'}
                                            </span>
                                        </button>
                                    );
                                })}
                                <div className="shrink-0 w-8 flex items-center justify-center text-[var(--text-secondary)]">
                                    <span className="material-symbols-outlined text-2xl">chevron_right</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 3. Share to */}
                    <div className="p-4">
                        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Share to</h3>
                        <div className="flex flex-wrap gap-4">
                            <button
                                type="button"
                                onClick={copyLink}
                                className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-[var(--theme-surface-hover)] transition-colors min-w-[80px]"
                            >
                                <span className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--theme-surface-hover)] text-[var(--text-secondary)]">
                                    <span className="material-symbols-outlined text-2xl">link</span>
                                </span>
                                <span className="text-xs font-medium text-[var(--text-primary)]">Copy link</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SharePostModal;
