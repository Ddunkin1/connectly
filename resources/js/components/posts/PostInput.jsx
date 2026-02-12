import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCreatePost } from '../../hooks/usePosts';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import { UilGlobe, UilUsersAlt, UilTimes } from '../common/Icons';

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
        const maxSize = 50 * 1024 * 1024; // 50MB for videos
        if (file.size > maxSize) {
            toast.error('File size must be less than 50MB');
            return;
        }
        const isVideo = file.type.startsWith('video/');
        if (isVideo) {
            // Use createObjectURL for videos - avoids loading entire file into memory (readAsDataURL would crash on large videos)
            setMediaPreview(URL.createObjectURL(file));
        } else {
            const reader = new FileReader();
            reader.onloadend = () => {
                setMediaPreview(reader.result);
            };
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
            if (mediaPreview && mediaType === 'video') {
                URL.revokeObjectURL(mediaPreview);
            }
            setMediaPreview(null);
            setMediaFile(null);
            setMediaType(null);
            setIsExpanded(false);
            if (onPostCreated) onPostCreated();
        } catch (error) {
            const d = error?.response?.data;
            const status = error?.response?.status;
            let msg = d?.message || d?.error || error?.message || 'Failed to post. Try a smaller file (under 50MB) or check your connection.';
            if (status === 422 && d?.errors?.media) {
                msg = Array.isArray(d.errors.media) ? d.errors.media[0] : d.errors.media;
            }
            toast.error(msg);
        }
    };

    const firstName = user?.name?.split(' ')[0] || 'there';

    return (
        <div className="glass-effect rounded-2xl p-5 mb-5 shadow-xl">
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="flex items-start gap-4">
                    <Avatar src={user?.profile_picture} alt={user?.name} size="lg" className="w-10 h-10 shrink-0 rounded-full ring-2 ring-primary/20" />
                    <div className="flex-1 min-w-0 space-y-4">
                        <textarea
                            {...register('content')}
                            placeholder={`What's on your mind, ${firstName}?`}
                            onFocus={() => setIsExpanded(true)}
                            rows={2}
                            className="w-full bg-transparent border-none focus:ring-0 text-[15px] leading-relaxed resize-none min-h-[48px] py-3 text-white placeholder:text-slate-500 focus:outline-none"
                        />
                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2">
                                <label htmlFor="media-upload" className="p-2 rounded-xl hover:bg-white/5 text-primary cursor-pointer transition-colors">
                                    <span className="material-symbols-outlined">image</span>
                                    <input type="file" id="media-upload" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
                                </label>
                                <button type="button" className="p-2 rounded-xl hover:bg-white/5 text-primary transition-colors">
                                    <span className="material-symbols-outlined">videocam</span>
                                </button>
                                <button type="button" className="p-2 rounded-xl hover:bg-white/5 text-primary transition-colors">
                                    <span className="material-symbols-outlined">sentiment_satisfied</span>
                                </button>
                                <button type="button" className="p-2 rounded-xl hover:bg-white/5 text-primary transition-colors">
                                    <span className="material-symbols-outlined">equalizer</span>
                                </button>
                            </div>
                            <button
                                type="submit"
                                disabled={!isFormValid || createPostMutation.isPending}
                                className="bg-primary hover:bg-primary/90 text-white h-12 min-h-12 px-8 rounded-xl font-semibold transition-all shadow-lg shadow-primary/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {createPostMutation.isPending ? '...' : 'Post'}
                            </button>
                        </div>
                    </div>
                </div>

                {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-6">
                            <span className="text-sm text-[#9CA3AF]">Who can see this?</span>
                            <label className="flex items-center gap-1.5 cursor-pointer text-[#9CA3AF] hover:text-white text-sm">
                                <input type="radio" value="public" {...register('visibility')} className="text-[var(--theme-accent)]" />
                                <UilGlobe size={16} color="currentColor" />
                                Public
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer text-[#9CA3AF] hover:text-white text-sm">
                                <input type="radio" value="followers" {...register('visibility')} className="text-[var(--theme-accent)]" />
                                <UilUsersAlt size={16} color="currentColor" />
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
                            <UilTimes size={14} color="white" />
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
};

export default PostInput;
