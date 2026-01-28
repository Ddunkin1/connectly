import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { commentsAPI } from '../../services/api';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import { formatDate } from '../../utils/formatDate';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const CommentThread = ({ postId, comment, level = 0 }) => {
    const [showReplies, setShowReplies] = useState(false);
    const [isReplying, setIsReplying] = useState(false);
    const user = useAuthStore((state) => state.user);
    const queryClient = useQueryClient();
    const { register, handleSubmit, reset } = useForm();

    const repliesQuery = useQuery({
        queryKey: ['comment-replies', comment.id],
        queryFn: () => commentsAPI.getComments(postId),
        enabled: showReplies && comment.replies_count > 0,
        select: (data) =>
            data.data.comments.filter((c) => c.parent_comment_id === comment.id),
    });

    const createCommentMutation = useMutation({
        mutationFn: (data) => commentsAPI.createComment(postId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['post', postId] });
            queryClient.invalidateQueries({ queryKey: ['comment-replies', comment.id] });
            reset();
            setIsReplying(false);
            setShowReplies(true);
            toast.success('Comment added');
        },
        onError: () => {
            toast.error('Failed to add comment');
        },
    });

    const onSubmit = (data) => {
        createCommentMutation.mutate({
            ...data,
            parent_comment_id: comment.id,
        });
    };

    return (
        <div className={`${level > 0 ? 'ml-8 mt-3' : ''}`}>
            <div className="flex items-start space-x-3">
                <Avatar src={comment.user?.profile_picture} alt={comment.user?.name} size="sm" />
                <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                            <span className="font-semibold text-sm text-gray-900">
                                {comment.user?.name}
                            </span>
                            <span className="text-xs text-gray-500">
                                {formatDate(comment.created_at)}
                            </span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                    </div>

                    <div className="flex items-center space-x-4 mt-2 ml-2">
                        <button
                            onClick={() => setIsReplying(!isReplying)}
                            className="text-xs text-gray-500 hover:text-[#359EFF]"
                        >
                            Reply
                        </button>
                        {comment.replies_count > 0 && (
                            <button
                                onClick={() => setShowReplies(!showReplies)}
                                className="text-xs text-gray-500 hover:text-[#359EFF]"
                            >
                                {showReplies ? 'Hide' : 'Show'} {comment.replies_count} replies
                            </button>
                        )}
                    </div>

                    {isReplying && (
                        <form onSubmit={handleSubmit(onSubmit)} className="mt-3">
                            <div className="flex items-start space-x-2">
                                <Avatar src={user?.profile_picture} alt={user?.name} size="sm" />
                                <div className="flex-1">
                                    <textarea
                                        {...register('content', { required: true })}
                                        placeholder="Write a reply..."
                                        rows={2}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#359EFF] text-sm resize-none"
                                    />
                                    <div className="flex items-center justify-end space-x-2 mt-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setIsReplying(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            size="sm"
                                            disabled={createCommentMutation.isPending}
                                            loading={createCommentMutation.isPending}
                                        >
                                            Reply
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    )}

                    {showReplies && repliesQuery.data && (
                        <div className="mt-3">
                            {repliesQuery.data.map((reply) => (
                                <CommentThread
                                    key={reply.id}
                                    postId={postId}
                                    comment={reply}
                                    level={level + 1}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommentThread;
