import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import LoadingSpinner from '../common/LoadingSpinner';
import { postsAPI } from '../../services/api';
import AdminErrorState from './AdminErrorState';

/**
 * Full post preview for admins (fetches GET /posts/:id — same as member app).
 */
const AdminPostPreviewModal = ({ postId, isOpen, onClose }) => {
    const enabled = Boolean(isOpen && postId);

    const { data: post, isLoading, error, refetch } = useQuery({
        queryKey: ['admin-post-preview', postId],
        queryFn: () => postsAPI.getPost(postId),
        enabled,
        select: (res) => res.data?.post,
    });

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Post preview" size="lg">
            {!enabled ? null : isLoading ? (
                <div className="flex justify-center py-16">
                    <LoadingSpinner />
                </div>
            ) : error ? (
                <AdminErrorState
                    title="Could not load post"
                    message={error?.response?.data?.message || error?.message}
                    onRetry={() => refetch()}
                />
            ) : post ? (
                <div className="space-y-4">
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
                        <p className="text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">{post.content}</p>
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

                    <p className="text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--theme-border)]">
                        Use this preview to decide on removal or account suspension. Actions are in the report card.
                    </p>
                </div>
            ) : (
                <p className="text-[var(--text-secondary)]">No post data.</p>
            )}
        </Modal>
    );
};

export default AdminPostPreviewModal;
