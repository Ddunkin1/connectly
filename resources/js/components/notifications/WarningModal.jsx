import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import { moderationAPI, postsAPI } from '../../services/api';
import { getReasonLabel } from '../../hooks/useReports';
import { SimplePageSkeleton } from '../common/skeletons';
import Avatar from '../common/Avatar';
import { Link } from 'react-router-dom';

const errMsg = (err) =>
    err?.response?.data?.message ||
    err?.response?.data?.errors?.message?.[0] ||
    err?.message ||
    'Something went wrong';

export default function WarningModal({ eventId, isOpen, onClose }) {
    const queryClient = useQueryClient();
    const [appealText, setAppealText] = useState('');

    useEffect(() => {
        if (isOpen) setAppealText('');
    }, [isOpen, eventId]);

    const q = useQuery({
        queryKey: ['warning-event', eventId],
        queryFn: () => moderationAPI.getWarningEvent(eventId).then((r) => r.data),
        enabled: !!eventId && isOpen,
    });

    const deleteMutation = useMutation({
        mutationFn: (postId) => postsAPI.deletePost(postId),
        onSuccess: () => {
            toast.success('Post deleted');
            queryClient.invalidateQueries({ queryKey: ['warning-event', eventId] });
        },
        onError: (e) => toast.error(errMsg(e)),
    });

    const appealMutation = useMutation({
        mutationFn: (message) =>
            moderationAPI.submitWarningAppeal({
                moderation_event_id: Number(eventId),
                message,
            }),
        onSuccess: () => {
            toast.success('Appeal submitted. Our team will review it as soon as possible.');
            setAppealText('');
            queryClient.invalidateQueries({ queryKey: ['warning-event', eventId] });
        },
        onError: (e) => toast.error(errMsg(e)),
    });

    const handleDeletePost = (postId) => {
        if (!postId) return;
        if (!window.confirm('Delete this post permanently? This cannot be undone.')) return;
        deleteMutation.mutate(postId);
    };

    const handleSubmitAppeal = (e) => {
        e.preventDefault();
        const msg = appealText.trim();
        if (msg.length < 20) {
            toast.error('Please write at least 20 characters explaining your appeal.');
            return;
        }
        appealMutation.mutate(msg);
    };

    const { event, post, appeal } = q.data || {};
    const reasonLabel = getReasonLabel(event?.reason_code);
    const appealPending = appeal?.status === 'pending';
    const appealClosed = appeal && !appealPending;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Account warning details" size="lg">
            {q.isLoading ? (
                <div className="py-4">
                    <SimplePageSkeleton rows={7} title={false} />
                </div>
            ) : q.isError ? (
                <div className="space-y-3 py-2">
                    <p className="text-[var(--text-primary)]/90 font-medium">Could not load this warning.</p>
                    <p className="text-sm text-[var(--text-secondary)]">{errMsg(q.error)}</p>
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl border border-[var(--theme-border)] text-sm font-medium bg-[var(--theme-surface-hover)] hover:bg-[var(--theme-surface-hover)]/80"
                        >
                            Close
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <section className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5">
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-amber-500 shrink-0 text-2xl">
                                gavel
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-[var(--text-primary)] mb-1">Formal warning</p>
                                <p className="text-xs text-[var(--text-secondary)] mb-2">
                                    Reason:{' '}
                                    <span className="text-[var(--text-primary)]">{reasonLabel}</span>
                                </p>
                                {event?.message && (
                                    <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
                                        {event.message}
                                    </p>
                                )}
                                {event?.created_at && (
                                    <p className="text-[11px] text-[var(--text-secondary)] uppercase tracking-wide mt-3">
                                        {new Date(event.created_at).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-0 overflow-hidden">
                        {post ? (
                            <>
                                <div className="px-4 py-3 border-b border-[var(--theme-border)] flex items-center justify-between gap-2 flex-wrap">
                                    <p className="text-sm font-semibold text-[var(--text-primary)]">Related post</p>
                                    <div className="flex items-center gap-2">
                                        <Link
                                            to={`/post/${post.id}`}
                                            className="text-xs font-medium text-[var(--theme-accent)] hover:underline"
                                            onClick={onClose}
                                        >
                                            Open post
                                        </Link>
                                        <button
                                            type="button"
                                            disabled={deleteMutation.isPending}
                                            onClick={() => handleDeletePost(post.id)}
                                            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/25 hover:bg-red-500/25 disabled:opacity-50"
                                        >
                                            {deleteMutation.isPending ? 'Deleting…' : 'Delete post'}
                                        </button>
                                    </div>
                                </div>
                                {post?.media_url && (
                                    <div className="w-full bg-black/20 aspect-video">
                                        {post.media_type === 'video' ? (
                                            <video
                                                src={post.media_url}
                                                className="w-full h-full object-cover"
                                                muted
                                                playsInline
                                                controls
                                            />
                                        ) : (
                                            <img
                                                src={post.media_url}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>
                                )}
                                {post?.content && (
                                    <div className="p-4">
                                        <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap line-clamp-6">
                                            {post.content}
                                        </p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="p-5">
                                <p className="text-sm text-[var(--text-secondary)]">
                                    No specific post was linked to this warning. You can still submit an appeal below if you believe this was a mistake.
                                </p>
                            </div>
                        )}
                    </section>

                    <section className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5">
                        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Appeal</h2>
                        {appealClosed ? (
                            <div className="space-y-3">
                                <p className="text-sm text-[var(--text-secondary)]">
                                    Status:{' '}
                                    <span className="font-medium text-[var(--text-primary)] capitalize">
                                        {appeal.status?.replace('_', ' ')}
                                    </span>
                                </p>
                                {appeal.message && (
                                    <div>
                                        <p className="text-xs font-medium text-[var(--text-secondary)] uppercase mb-1">
                                            Your message
                                        </p>
                                        <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{appeal.message}</p>
                                    </div>
                                )}
                                {appeal.admin_reply && (
                                    <div className="rounded-lg bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 p-3">
                                        <p className="text-xs font-medium text-[var(--theme-accent)] mb-1">
                                            Response from moderation
                                        </p>
                                        <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{appeal.admin_reply}</p>
                                        {appeal.answered_at && (
                                            <p className="text-[11px] text-[var(--text-secondary)] mt-2">
                                                {new Date(appeal.answered_at).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : appealPending ? (
                            <p className="text-sm text-[var(--text-secondary)]">
                                Your appeal is <strong className="text-[var(--text-primary)]">pending review</strong>. We will notify you when the team responds.
                            </p>
                        ) : (
                            <form onSubmit={handleSubmitAppeal} className="space-y-3">
                                <p className="text-sm text-[var(--text-secondary)]">
                                    Explain why you believe this warning should be lifted or adjusted (minimum 20 characters).
                                </p>
                                <textarea
                                    value={appealText}
                                    onChange={(e) => setAppealText(e.target.value)}
                                    rows={6}
                                    maxLength={5000}
                                    className="w-full rounded-xl border border-[var(--theme-border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm p-3 resize-y min-h-[120px] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/35"
                                    placeholder="I believe this warning was issued in error because…"
                                />
                                <p className="text-xs text-[var(--text-secondary)]">
                                    {appealText.trim().length} / 5000 characters (min. 20)
                                </p>
                                <div className="flex flex-wrap justify-end gap-2 pt-1">
                                    <button
                                        type="submit"
                                        disabled={appealMutation.isPending}
                                        className="px-4 py-2 rounded-xl bg-[var(--theme-accent)] text-white text-sm font-semibold disabled:opacity-50 shadow-sm hover:opacity-95 transition-opacity"
                                    >
                                        {appealMutation.isPending ? 'Submitting…' : 'Submit appeal'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </section>

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl border border-[var(--theme-border)] text-sm font-medium bg-[var(--theme-surface-hover)] hover:bg-[var(--theme-surface-hover)]/80"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
}

