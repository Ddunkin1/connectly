import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import { PostDetailSkeleton } from '../common/skeletons';
import { postsAPI } from '../../services/api';
import AdminErrorState from './AdminErrorState';
import AdminReportUserPanel from './AdminReportUserPanel';

const STATUS_LABELS = {
    pending: 'Pending',
    reviewed: 'Reviewed',
    dismissed: 'Cancelled',
    action_taken: 'Moderated',
};

/**
 * Post preview with optional reported-user moderation panel (same as User details modal).
 *
 * @param {object} [reportContext] — when set, shows “This report” actions for post reports
 * @param {number} reportContext.reportId
 * @param {string} reportContext.status
 * @param {boolean} [reportContext.removePending]
 * @param {boolean} [reportContext.dismissPending]
 * @param {() => void} [reportContext.onRemovePost]
 * @param {() => void} [reportContext.onRequestDismiss] — opens cancel flow (reason + message to reporter)
 */
const AdminPostPreviewModal = ({
    postId,
    isOpen,
    onClose,
    authorUserId,
    adminUserId,
    reportContext,
}) => {
    const enabled = Boolean(isOpen && postId);

    const { data: post, isLoading, error, refetch } = useQuery({
        queryKey: ['admin-post-preview', postId],
        queryFn: () => postsAPI.getPost(postId),
        enabled,
        select: (res) => res.data?.post,
    });

    const showUserPanel = Boolean(authorUserId);
    const showReportBar =
        reportContext &&
        reportContext.status === 'pending' &&
        (reportContext.onRemovePost || reportContext.onRequestDismiss);

    const modalTitle = showUserPanel ? 'Post & reported user' : 'Post preview';
    const modalSize = showUserPanel ? '3xl' : 'lg';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size={modalSize}>
            {!enabled ? null : isLoading ? (
                <div className="py-4 max-w-2xl mx-auto">
                    <PostDetailSkeleton />
                </div>
            ) : error ? (
                <AdminErrorState
                    title="Could not load post"
                    message={error?.response?.data?.message || error?.message}
                    onRetry={() => refetch()}
                />
            ) : post ? (
                <div
                    className={
                        showUserPanel
                            ? 'flex flex-col lg:flex-row gap-4 lg:gap-0 min-h-0 lg:items-stretch lg:h-[min(74vh,620px)] lg:max-h-[78vh] lg:overflow-hidden'
                            : 'space-y-4'
                    }
                >
                    <div
                        className={
                            showUserPanel
                                ? 'min-w-0 flex-1 space-y-4 lg:min-h-0 lg:overflow-y-auto lg:pr-2'
                                : 'space-y-4'
                        }
                    >
                        <div className="flex items-start gap-3">
                            <Avatar src={post.user?.profile_picture} alt={post.user?.name} size="md" />
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold text-[var(--text-primary)]">{post.user?.name}</p>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    @{post.user?.username} · Post #{post.id}
                                </p>
                                {post.created_at && (
                                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                        {new Date(post.created_at).toLocaleString()}
                                    </p>
                                )}
                            </div>
                            <Link
                                to={`/post/${post.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm font-medium text-[var(--theme-accent)] hover:underline shrink-0"
                            >
                                Open in app
                            </Link>
                        </div>

                        {post.shared_post && (
                            <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-hover)]/50 p-3 text-sm">
                                <p className="text-[var(--text-secondary)] mb-1">Shared post</p>
                                <p className="text-[var(--text-primary)] whitespace-pre-wrap">{post.content}</p>
                            </div>
                        )}

                        {!post.shared_post && post.media_url && (
                            <div className="rounded-xl overflow-hidden bg-black/10 border border-[var(--theme-border)]">
                                {post.media_type === 'image' ? (
                                    <img
                                        src={post.media_url}
                                        alt=""
                                        className="w-full max-h-[min(420px,50vh)] object-contain"
                                    />
                                ) : (
                                    <video
                                        src={post.media_url}
                                        controls
                                        className="w-full max-h-[min(420px,50vh)] object-contain"
                                    />
                                )}
                            </div>
                        )}

                        {!post.shared_post && post.content && (
                            <p className="text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
                                {post.content}
                            </p>
                        )}

                        {post.poll && (
                            <div className="rounded-xl border border-[var(--theme-border)] p-4 bg-[var(--theme-surface-hover)]/40">
                                <p className="font-medium text-[var(--text-primary)] mb-2">{post.poll.question}</p>
                                <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
                                    {post.poll.options?.map((o) => (
                                        <li key={o.id} className="flex justify-between gap-2">
                                            <span>{o.text}</span>
                                            <span>{o.percentage}%</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {!showUserPanel && (
                            <p className="text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--theme-border)]">
                                Use this preview to decide on removal or account suspension. Actions are in the report
                                card.
                            </p>
                        )}
                    </div>

                    {showUserPanel && (
                        <div className="flex flex-col min-h-0 w-full min-w-0 lg:w-[min(100%,400px)] lg:shrink-0 lg:border-l lg:border-[var(--theme-border)] lg:pl-4 lg:overflow-hidden lg:min-h-0">
                            {reportContext?.reportId != null && (
                                <p className="text-xs text-[var(--text-secondary)] mb-2 shrink-0">
                                    Report #{reportContext.reportId} ·{' '}
                                    {STATUS_LABELS[reportContext.status] ?? reportContext.status}
                                </p>
                            )}
                            {showReportBar && (
                                <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-hover)]/40 p-3 mb-3 space-y-2 shrink-0">
                                    <p className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide">
                                        This report
                                    </p>
                                    <p className="text-[11px] text-[var(--text-secondary)] leading-snug">
                                        Warn, suspend, or ban marks the report <strong>Moderated</strong>. Remove post
                                        does the same. Use cancel only if no action is needed.
                                    </p>
                                    <div className="flex flex-col gap-2">
                                        {reportContext.onRemovePost && (
                                            <button
                                                type="button"
                                                disabled={reportContext.removePending}
                                                onClick={reportContext.onRemovePost}
                                                className="w-full text-center px-3 py-2 rounded-xl text-xs font-semibold bg-red-500/15 text-red-700 hover:bg-red-500/25 disabled:opacity-50 border border-red-500/20"
                                            >
                                                Remove post
                                            </button>
                                        )}
                                        {reportContext.onRequestDismiss && (
                                            <button
                                                type="button"
                                                disabled={reportContext.dismissPending}
                                                onClick={reportContext.onRequestDismiss}
                                                className="w-full text-center px-3 py-2 rounded-xl text-xs font-semibold border border-[var(--theme-border)] text-[var(--text-secondary)] hover:bg-[var(--theme-surface-hover)] disabled:opacity-50"
                                            >
                                                Cancel report (no action)
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] w-full min-w-0">
                                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-3 pt-3 pb-1 border-b border-[var(--theme-border)] shrink-0">
                                    Reported user
                                </p>
                                <AdminReportUserPanel
                                    userId={authorUserId}
                                    enabled={enabled && !!authorUserId}
                                    adminUserId={adminUserId}
                                    onClose={onClose}
                                    variant="embedded"
                                    warnPostId={post?.id ?? postId}
                                    resolveReportId={
                                        reportContext?.status === 'pending' ? reportContext.reportId : undefined
                                    }
                                    onReportModerated={onClose}
                                />
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <p className="text-[var(--text-secondary)]">No post data.</p>
            )}
        </Modal>
    );
};

export default AdminPostPreviewModal;
