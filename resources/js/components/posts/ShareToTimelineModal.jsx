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
                className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Share to your timeline</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#359EFF] focus:border-transparent resize-none"
                            maxLength={5000}
                        />
                        <p className="text-xs text-gray-500 mt-1">{content.length}/5000</p>

                        {/* Original post preview */}
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-500 mb-2">Sharing this post:</p>
                            <div className="flex gap-3">
                                <Avatar src={post.user?.profile_picture} alt={post.user?.name} size="sm" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">{post.user?.name}</p>
                                    <p className="text-xs text-gray-500">@{post.user?.username} · {formatDate(post.created_at)}</p>
                                    <p className="text-sm text-gray-700 mt-1 line-clamp-2">{post.content || '—'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Who can see this?</p>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="visibility"
                                        value="public"
                                        checked={visibility === 'public'}
                                        onChange={(e) => setVisibility(e.target.value)}
                                        className="text-[#359EFF]"
                                    />
                                    <span className="text-sm">Public</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="visibility"
                                        value="followers"
                                        checked={visibility === 'followers'}
                                        onChange={(e) => setVisibility(e.target.value)}
                                        className="text-[#359EFF]"
                                    />
                                    <span className="text-sm">Friends</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
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
