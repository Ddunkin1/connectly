import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSubmitCommunityPost } from '../../hooks/useCommunities';
import useAuthStore from '../../store/authStore';
import Avatar from '../common/Avatar';
import { UilImage, UilTimes } from '../common/Icons';

const CommunityPostInput = ({ communityId, requiresApproval, onPostSubmitted }) => {
    const user = useAuthStore((state) => state.user);
    const { register, handleSubmit, reset, watch } = useForm();
    const submitMutation = useSubmitCommunityPost(communityId);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaType, setMediaType] = useState(null);

    const content = watch('content', '');
    const isFormValid = content.trim().length > 0 || mediaFile !== null;

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const maxSize = 50 * 1024 * 1024; // 50MB for videos
        if (file.size > maxSize) {
            import('react-hot-toast').then(({ default: toast }) => toast.error('File size must be less than 50MB'));
            return;
        }
        const isVideo = file.type.startsWith('video/');
        if (isVideo) {
            setMediaPreview(URL.createObjectURL(file));
        } else {
            const reader = new FileReader();
            reader.onloadend = () => setMediaPreview(reader.result);
            reader.readAsDataURL(file);
        }
        setMediaType(isVideo ? 'video' : 'image');
        setMediaFile(file);
    };

    const removeMedia = () => {
        if (mediaPreview && mediaType === 'video') {
            URL.revokeObjectURL(mediaPreview);
        }
        setMediaPreview(null);
        setMediaFile(null);
        setMediaType(null);
    };

    const onSubmit = async (data) => {
        if (!data.content?.trim() && !mediaFile) return;
        try {
            const formData = new FormData();
            formData.append('content', data.content || '');
            if (mediaFile) formData.append('media', mediaFile);

            await submitMutation.mutateAsync(formData);
            reset();
            if (mediaPreview && mediaType === 'video') {
                URL.revokeObjectURL(mediaPreview);
            }
            setMediaPreview(null);
            setMediaFile(null);
            setMediaType(null);
            onPostSubmitted?.();
        } catch {
            // Error handled by mutation onError
        }
    };

    const firstName = user?.name?.split(' ')[0] || 'there';

    return (
        <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 mb-6 shadow-[var(--shadow-card)]">
            {requiresApproval && (
                <p className="text-sm text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">schedule</span>
                    Your post will be pending moderator approval.
                </p>
            )}
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="flex items-center gap-3">
                    <Avatar src={user?.profile_picture} alt={user?.name} size="md" className="shrink-0" />
                    <div className="flex-1 min-w-0 flex items-center gap-2 h-12 px-3 rounded-full bg-[var(--theme-surface-hover)] border border-[var(--theme-border)]">
                        <input
                            {...register('content')}
                            type="text"
                            placeholder={`Post to the community, ${firstName}...`}
                            className="flex-1 min-w-0 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-secondary)]/70 text-sm focus:outline-none"
                        />
                        <label htmlFor="community-media-upload" className="cursor-pointer text-[var(--theme-accent)] hover:opacity-80 shrink-0" aria-label="Add image or video">
                            <UilImage size={20} color="currentColor" />
                            <input type="file" id="community-media-upload" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
                        </label>
                        <div className="w-px h-5 bg-[var(--theme-border)] shrink-0" aria-hidden="true" />
                        <button
                            type="submit"
                            disabled={!isFormValid || submitMutation.isPending}
                            className="shrink-0 px-3 h-8 rounded-full bg-[var(--theme-accent)] hover:opacity-90 text-white font-medium text-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                        >
                            {submitMutation.isPending ? '...' : 'Post'}
                        </button>
                    </div>
                </div>

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
                            <UilTimes size={14} color="white" />
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
};

export default CommunityPostInput;
