import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCreatePost } from '../../hooks/usePosts';
import useAuthStore from '../../store/authStore';
import { useEdgeStore } from '../../lib/edgestoreClient.jsx';
import toast from 'react-hot-toast';
import Avatar from '../common/Avatar';
import Button from '../common/Button';

const PostInput = ({ onPostCreated }) => {
    const user = useAuthStore((state) => state.user);
    const { register, handleSubmit, reset, watch, setValue } = useForm();
    const createPostMutation = useCreatePost();
    const [isExpanded, setIsExpanded] = useState(false);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [mediaType, setMediaType] = useState(null);
    const { edgestore } = useEdgeStore();

    const content = watch('content', '');
    const mediaUrl = watch('media_url', '');

    const handleFileChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setMediaPreview(reader.result);
            const isImage = file.type.startsWith('image/');
            setMediaType(isImage ? 'image' : 'video');
        };
        reader.readAsDataURL(file);

        try {
            // Upload to EdgeStore using postMedia bucket
            const isImage = file.type.startsWith('image/');
            const res = await edgestore.postMedia.upload({
                file: file,
                options: {
                    temporary: false,
                },
                input: {
                    mediaType: isImage ? 'image' : 'video',
                },
            });

            // Set the URL in the form
            setValue('media_url', res.url);
            setValue('media_type', isImage ? 'image' : 'video');
            toast.success('Media uploaded successfully');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload media. Please try again.');
            setMediaPreview(null);
            setMediaType(null);
        }
    };

    const removeMedia = () => {
        setMediaPreview(null);
        setMediaType(null);
        setValue('media_url', '');
        setValue('media_type', '');
    };

    const onSubmit = async (data) => {
        try {
            // Prepare data for API
            const postData = {
                content: data.content,
                media_url: data.media_url || null,
                media_type: data.media_type || null,
                visibility: data.visibility || 'public',
            };

            await createPostMutation.mutateAsync(postData);
            reset();
            setMediaPreview(null);
            setMediaType(null);
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
                        <div className="flex items-center space-x-3">
                            <textarea
                                {...register('content', { required: 'Content is required', maxLength: 5000 })}
                                placeholder="What's happening in your community?"
                                rows={isExpanded ? 4 : 2}
                                onFocus={() => setIsExpanded(true)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#359EFF] focus:border-transparent resize-none"
                            />
                            <label
                                htmlFor="media-upload"
                                className="cursor-pointer text-[#359EFF] hover:text-[#2a8eef] transition-colors flex-shrink-0"
                                title="Add image or video"
                            >
                                <span className="material-symbols-outlined text-2xl">image</span>
                                <input
                                    type="file"
                                    id="media-upload"
                                    accept="image/*,video/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>
                        </div>
                        {mediaPreview && (
                            <div className="relative mt-3">
                                {mediaType === 'image' ? (
                                    <img
                                        src={mediaPreview}
                                        alt="Preview"
                                        className="w-full h-64 object-cover rounded-lg"
                                    />
                                ) : (
                                    <video
                                        src={mediaPreview}
                                        controls
                                        className="w-full h-64 rounded-lg"
                                    >
                                        Your browser does not support the video tag.
                                    </video>
                                )}
                                <button
                                    type="button"
                                    onClick={removeMedia}
                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                    title="Remove media"
                                >
                                    <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                            </div>
                        )}
                        <div className="flex items-center justify-end mt-3">
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
