import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import { formatDate } from '../../utils/formatDate';

const ShareToTimelineModal = ({ post, onClose, onSubmit, isSubmitting }) => {
    const [visibility, setVisibility] = useState('public');
    const { register, handleSubmit, watch } = useForm();
    const content = watch('content', '');

    const handleFormSubmit = (data) => {
        const formData = new FormData();
        formData.append('content', data.content?.trim() || '');
        formData.append('visibility', visibility);
        formData.append('shared_post_id', String(post.id));
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <div
                className="bg-[#252538] rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-700"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Share to your timeline</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-white/10 text-gray-400"
                        aria-label="Close"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col flex-1 min-h-0">
                    <div className="p-4 flex-1 overflow-y-auto">
                        <textarea
                            {...register('content')}
                            placeholder="Add your thoughts (optional)"
                            rows={3}
                            className="w-full px-4 py-2 bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:ring-2 focus:ring-[var(--theme-accent)]/30 focus:border-[var(--theme-accent)]/40 focus:outline-none resize-none"
                            maxLength={5000}
                        />
                        <p className="text-xs text-gray-400 mt-1">{content.length}/5000</p>

                        {/* Original post preview */}
                        <div className="mt-4 p-3 bg-[var(--theme-surface-hover)] rounded-lg border border-[var(--theme-border)]">
                            <p className="text-xs text-[var(--text-secondary)] mb-2">Sharing this post:</p>
                            <div className="flex gap-3">
                                <Avatar src={post.user?.profile_picture} alt={post.user?.name} size="sm" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[var(--text-primary)]">{post.user?.name}</p>
                                    <p className="text-xs text-[var(--text-secondary)]">@{post.user?.username} · {formatDate(post.created_at)}</p>
                                    <p className="text-sm text-[var(--text-primary)] mt-1 line-clamp-2">{post.content || '—'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4">
                            <p className="text-sm font-medium text-[var(--text-primary)] mb-2">Who can see this?</p>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer text-[var(--text-secondary)]">
                                    <input
                                        type="radio"
                                        name="visibility"
                                        value="public"
                                        checked={visibility === 'public'}
                                        onChange={(e) => setVisibility(e.target.value)}
                                        className="text-[var(--theme-accent)]"
                                    />
                                    <span className="text-sm">Public</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer text-[var(--text-secondary)]">
                                    <input
                                        type="radio"
                                        name="visibility"
                                        value="followers"
                                        checked={visibility === 'followers'}
                                        onChange={(e) => setVisibility(e.target.value)}
                                        className="text-[var(--theme-accent)]"
                                    />
                                    <span className="text-sm">Friends</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 border-t border-gray-700 flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
                            Share to timeline
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ShareToTimelineModal;
