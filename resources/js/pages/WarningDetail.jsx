import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { moderationAPI, postsAPI } from '../services/api';
import { getReasonLabel } from '../hooks/useReports';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Avatar from '../components/common/Avatar';

const errMsg = (err) =>
    err?.response?.data?.message || err?.response?.data?.errors?.message?.[0] || err?.message || 'Something went wrong';

const WarningDetail = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [appealText, setAppealText] = useState('');

    const q = useQuery({
        queryKey: ['warning-event', eventId],
        queryFn: () => moderationAPI.getWarningEvent(eventId).then((r) => r.data),
        enabled: !!eventId,
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

    if (!eventId) {
        return (
            <div className="max-w-2xl mx-auto">
                <p className="text-[var(--text-secondary)]">Invalid warning.</p>
                <Link to="/notifications" className="text-[var(--theme-accent)] text-sm mt-2 inline-block">
                    Back to notifications
                </Link>
            </div>
        );
    }

    if (q.isLoading) {
        return (
            <div className="flex justify-center py-16">
                <LoadingSpinner />
            </div>
        );
    }

    if (q.isError) {
        const status = q.error?.response?.status;
        return (
            <div className="max-w-2xl mx-auto">
                <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">Warning</h1>
                <p className="text-[var(--text-secondary)] mb-4">
                    {status === 404
                        ? 'This warning could not be found.'
                        : status === 403
                          ? 'You do not have access to this warning.'
                          : 'Could not load this warning.'}
                </p>
                <button
                    type="button"
                    onClick={() => navigate('/notifications')}
                    className="text-[var(--theme-accent)] text-sm font-medium"
                >
                    Back to notifications
                </button>
            </div>
        );
    }

    const { event, post, appeal } = q.data || {};
    const reasonLabel = getReasonLabel(event?.reason_code);
    const appealPending = appeal?.status === 'pending';
    const appealClosed = appeal && !appealPending;

    return (
        <div className="max-w-2xl mx-auto w-full">
            <div className="flex items-center gap-3 mb-6">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded-lg hover:bg-[var(--theme-surface-hover)]"
                    aria-label="Go back"
                >
                    <span className="material-symbols-outlined text-xl">arrow_back</span>
                </button>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">Account warning</h1>
            </div>

            <section className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5 mb-6">
                <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-amber-500 shrink-0 text-2xl">gavel</span>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--text-primary)] mb-1">Formal warning</p>
                        <p className="text-xs text-[var(--text-secondary)] mb-2">
                            Reason: <span className="text-[var(--text-primary)]">{reasonLabel}</span>
                        </p>
                        {event?.message && (
                            <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">{event.message}</p>
                        )}
                        {event?.created_at && (
                            <p className="text-[11px] text-[var(--text-secondary)] uppercase tracking-wide mt-3">
                                {new Date(event.created_at).toLocaleString()}
                            </p>
                        )}
                    </div>
                </div>
            </section>

            {post ? (
                <section className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] overflow-hidden mb-6">
                    <div className="px-4 py-3 border-b border-[var(--theme-border)] flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-[var(--text-primary)]">Related post</p>
                        <div className="flex items-center gap-2">
                            <Link
                                to={`/post/${post.id}`}
                                className="text-xs font-medium text-[var(--theme-accent)] hover:underline"
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
                    {post.user && (
                        <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--theme-border)] bg-[var(--theme-surface-hover)]/30">
                            <Avatar src={post.user.profile_picture} alt={post.user.name} size="sm" className="w-8 h-8 rounded-full" />
                            <span className="text-sm text-[var(--text-primary)]">@{post.user.username}</span>
                        </div>
                    )}
                    {post.media_url && (
                        <div className="aspect-video w-full bg-black/20">
                            {post.media_type === 'video' ? (
                                <video src={post.media_url} className="w-full h-full object-cover" muted playsInline controls />
                            ) : (
                                <img src={post.media_url} alt="" className="w-full h-full object-cover" />
                            )}
                        </div>
                    )}
                    {post.content && (
                        <div className="p-4">
                            <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap line-clamp-6">{post.content}</p>
                        </div>
                    )}
                </section>
            ) : (
                <section className="rounded-xl border border-dashed border-[var(--theme-border)] bg-[var(--theme-surface)]/50 p-5 mb-6">
                    <p className="text-sm text-[var(--text-secondary)]">
                        No specific post was linked to this warning. You can still submit an appeal below if you believe this was a mistake.
                    </p>
                </section>
            )}

            <section className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Appeal</h2>
                {appealClosed ? (
                    <div className="space-y-3">
                        <p className="text-sm text-[var(--text-secondary)]">
                            Status:{' '}
                            <span className="font-medium text-[var(--text-primary)] capitalize">{appeal.status?.replace('_', ' ')}</span>
                        </p>
                        {appeal.message && (
                            <div>
                                <p className="text-xs font-medium text-[var(--text-secondary)] uppercase mb-1">Your message</p>
                                <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{appeal.message}</p>
                            </div>
                        )}
                        {appeal.admin_reply && (
                            <div className="rounded-lg bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 p-3">
                                <p className="text-xs font-medium text-[var(--theme-accent)] mb-1">Response from moderation</p>
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
                            Explain why you believe this warning should be lifted or adjusted (minimum 20 characters). You can only submit one appeal per warning.
                        </p>
                        <textarea
                            value={appealText}
                            onChange={(e) => setAppealText(e.target.value)}
                            rows={6}
                            maxLength={5000}
                            className="w-full rounded-xl border border-[var(--theme-border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm p-3 resize-y min-h-[120px] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/35"
                            placeholder="I believe this warning was issued in error because…"
                        />
                        <p className="text-xs text-[var(--text-secondary)]">{appealText.trim().length} / 5000 characters (min. 20)</p>
                        <button
                            type="submit"
                            disabled={appealMutation.isPending}
                            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold bg-[var(--theme-accent)] text-white hover:opacity-95 disabled:opacity-50"
                        >
                            {appealMutation.isPending ? 'Submitting…' : 'Submit appeal'}
                        </button>
                    </form>
                )}
            </section>

            <p className="text-center mt-8">
                <Link to="/safety" className="text-sm text-[var(--theme-accent)] hover:underline">
                    Safety Center
                </Link>
            </p>
        </div>
    );
};

export default WarningDetail;
