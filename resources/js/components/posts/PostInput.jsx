import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCreatePost } from '../../hooks/usePosts';
import useAuthStore from '../../store/authStore';
import Avatar from '../common/Avatar';
import Button from '../common/Button';

const PostInput = ({ onPostCreated }) => {
    const user = useAuthStore((state) => state.user);
    const { register, handleSubmit, reset, watch } = useForm();
    const createPostMutation = useCreatePost();
    const [isExpanded, setIsExpanded] = useState(false);

    const content = watch('content', '');

    const onSubmit = async (data) => {
        try {
            await createPostMutation.mutateAsync(data);
            reset();
            setIsExpanded(false);
            if (onPostCreated) onPostCreated();
        } catch (error) {
            // Error handled by mutation
        }
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="flex items-start space-x-3">
                    <Avatar src={user?.profile_picture} alt={user?.name} size="md" />
                    <div className="flex-1">
                        <textarea
                            {...register('content', { required: 'Content is required', maxLength: 5000 })}
                            placeholder="What's on your mind?"
                            rows={isExpanded ? 4 : 2}
                            onFocus={() => setIsExpanded(true)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#359EFF] focus:border-transparent resize-none"
                        />
                        <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center space-x-2">
                                <button
                                    type="button"
                                    className="text-gray-500 hover:text-[#359EFF] transition-colors"
                                    title="Add image"
                                >
                                    <span className="material-symbols-outlined">image</span>
                                </button>
                                <button
                                    type="button"
                                    className="text-gray-500 hover:text-[#359EFF] transition-colors"
                                    title="Add video"
                                >
                                    <span className="material-symbols-outlined">videocam</span>
                                </button>
                            </div>
                            <div className="flex items-center space-x-2">
                                {content.length > 0 && (
                                    <span className="text-xs text-gray-500">
                                        {content.length}/5000
                                    </span>
                                )}
                                {isExpanded && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setIsExpanded(false);
                                            reset();
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                )}
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={!content.trim() || createPostMutation.isPending}
                                    loading={createPostMutation.isPending}
                                >
                                    Post
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default PostInput;
