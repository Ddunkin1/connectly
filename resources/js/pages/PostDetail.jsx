import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { usePost } from '../hooks/usePosts';
import { useCreateComment } from '../hooks/useComments';
import { commentsAPI } from '../services/api';
import PostCard from '../components/posts/PostCard';
import CommentThread from '../components/posts/CommentThread';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import useAuthStore from '../store/authStore';

const PostDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: post, isLoading } = usePost(id);
    const user = useAuthStore((state) => state.user);
    const { register, handleSubmit, reset } = useForm();
    const createCommentMutation = useCreateComment();

    const { data: commentsData, isLoading: commentsLoading } = useQuery({
        queryKey: ['comments', id],
        queryFn: () => commentsAPI.getComments(id),
        enabled: !!id,
        select: (data) => data.data.comments,
    });

    const onSubmit = (data) => {
        createCommentMutation.mutate(
            { postId: id, data },
            {
                onSuccess: () => reset(),
            }
        );
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Post not found</p>
            </div>
        );
    }

    const topLevelComments = commentsData?.filter((comment) => !comment.parent_comment_id) || [];

    return (
        <div className="max-w-3xl mx-auto">
            <PostCard
                post={post}
                onDeleted={() => navigate('/home', { replace: true })}
                onCommentClick={() => document.getElementById('comment-section')?.scrollIntoView({ behavior: 'smooth' })}
            />

            {/* Comment Input */}
            <div id="comment-section" className="bg-white rounded-lg border border-gray-200 p-4 mt-4">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="flex items-start space-x-3">
                        <Avatar src={user?.profile_picture} alt={user?.name} size="md" />
                        <div className="flex-1">
                            <textarea
                                {...register('content', { required: 'Comment cannot be empty' })}
                                placeholder="Write a comment..."
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#359EFF] focus:border-transparent resize-none"
                            />
                            <div className="flex items-center justify-end mt-2">
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={createCommentMutation.isPending}
                                    loading={createCommentMutation.isPending}
                                >
                                    Comment
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            {/* Comments */}
            <div className="mt-4 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                    Comments ({Math.max(post.comments_count ?? 0, commentsData?.length ?? 0)})
                </h3>
                {commentsLoading ? (
                    <div className="flex justify-center py-8">
                        <LoadingSpinner />
                    </div>
                ) : topLevelComments.length === 0 ? (
                    <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                        <p className="text-gray-500">No comments yet. Be the first to comment!</p>
                    </div>
                ) : (
                    topLevelComments.map((comment) => (
                        <CommentThread key={comment.id} postId={id} comment={comment} />
                    ))
                )}
            </div>
        </div>
    );
};

export default PostDetail;
