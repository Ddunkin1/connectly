import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCreatePost } from '../../hooks/usePosts';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import Avatar from '../common/Avatar';
import Button from '../common/Button';

/* Post input: 64px height pill, 40px avatar, 80x40 Post button */

const PostInput = ({ onPostCreated }) => {
    const user = useAuthStore((state) => state.user);
    const { register, handleSubmit, reset, watch } = useForm({ defaultValues: { visibility: 'public' } });
    const createPostMutation = useCreatePost();
    const [isExpanded, setIsExpanded] = useState(false);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaType, setMediaType] = useState(null);

    const content = watch('content', '');
    const isFormValid = content.trim().length > 0 || mediaFile !== null;

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must be less than 10MB');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setMediaPreview(reader.result);
            setMediaType(file.type.startsWith('image/') ? 'image' : 'video');
        };
        reader.readAsDataURL(file);
        setMediaFile(file);
    };

    const removeMedia = () => {
        setMediaPreview(null);
        setMediaFile(null);
        setMediaType(null);
    };

    const onSubmit = async (data) => {
        if (!data.content.trim() && !mediaFile) {
            toast.error('Please add content or select a media file');
            return;
        }
        try {
            const formData = new FormData();
            formData.append('content', data.content || '');
            formData.append('visibility', data.visibility || 'public');
            if (mediaFile) formData.append('media', mediaFile);

            await createPostMutation.mutateAsync(formData);
            reset();
            setMediaPreview(null);
            setMediaFile(null);
            setMediaType(null);
            setIsExpanded(false);
            if (onPostCreated) onPostCreated();
        } catch (error) {}
    };

    const firstName = user?.name?.split(' ')[0] || 'there';

    return (
        <div className="theme-surface rounded-[16px] p-4 mb-6 card-shadow" style={{ margin: '24px 0' }}>
            <form onSubmit={handleSubmit(onSubmit)}>
                {/* Single row: 64px height pill - avatar (40px) + input + Post button (80x40) */}
                <div className="flex items-center gap-3 min-h-[64px]">
                    <Avatar src={user?.profile_picture} alt={user?.name} size="lg" className="w-10 h-10 shrink-0" />
                    <div className="flex-1 min-w-0 flex items-center gap-3 h-16 px-4 rounded-[32px] bg-[#1A1A1A] border border-transparent">
                        <input
                            {...register('content')}
                            type="text"
                            placeholder={`What's on your mind, ${firstName}?`}
                            onFocus={() => setIsExpanded(true)}
                            className="flex-1 min-w-0 bg-transparent text-white placeholder-[#9CA3AF] text-sm focus:outline-none"
                        />
                        <label htmlFor="media-upload" className="cursor-pointer text-[var(--theme-accent)] hover:opacity-80 shrink-0">
                            <span className="material-symbols-outlined text-[24px]">image</span>
                            <input type="file" id="media-upload" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
                        </label>
                    </div>
                    <button
                        type="submit"
                        disabled={!isFormValid || createPostMutation.isPending}
                        className="shrink-0 w-20 h-10 rounded-[20px] bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-medium text-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {createPostMutation.isPending ? '...' : 'Post'}
                    </button>
                </div>

                {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-[#2A2A2A] flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-6">
                            <span className="text-sm text-[#9CA3AF]">Who can see this?</span>
                            <label className="flex items-center gap-1.5 cursor-pointer text-[#9CA3AF] hover:text-white text-sm">
                                <input type="radio" value="public" {...register('visibility')} className="text-[var(--theme-accent)]" />
                                <span className="material-symbols-outlined text-sm">public</span>
                                Public
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer text-[#9CA3AF] hover:text-white text-sm">
                                <input type="radio" value="followers" {...register('visibility')} className="text-[var(--theme-accent)]" />
                                <span className="material-symbols-outlined text-sm">group</span>
                                Friends only
                            </label>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => { setIsExpanded(false); reset(); }}>
                            Cancel
                        </Button>
                    </div>
                )}

                {mediaPreview && (
                    <div className="relative mt-4">
                        {mediaType === 'image' ? (
                            <img src={mediaPreview} alt="Preview" className="w-full h-48 object-cover rounded-[12px]" />
                        ) : (
                            <video src={mediaPreview} controls className="w-full h-48 rounded-[12px]" />
                        )}
                        <button
                            type="button"
                            onClick={removeMedia}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
};

export default PostInput;
