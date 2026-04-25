import React, { useState, useId, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useCreatePost } from '../../hooks/usePosts';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import { UilGlobe, UilUsersAlt, UilTimes } from '../common/Icons';

/* Post input: 64px height pill, 40px avatar, 80x40 Post button */

const PostInput = ({ onPostCreated, variant = 'feed' }) => {
    const user = useAuthStore((state) => state.user);
    const { register, handleSubmit, reset, watch } = useForm({ defaultValues: { visibility: 'public' } });
    const createPostMutation = useCreatePost();
    const [isExpanded, setIsExpanded] = useState(false);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaType, setMediaType] = useState(null);
    const [pollMode, setPollMode] = useState(false);
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);

    const content = watch('content', '');
    const mediaInputId = useId();
    const mediaInputRef = useRef(null);
    const hasPoll = pollMode && pollQuestion.trim() && pollOptions.filter((o) => o.trim()).length >= 2;
    const isFormValid = content.trim().length > 0 || mediaFile !== null || hasPoll;

    const addPollOption = () => {
        if (pollOptions.length < 5) setPollOptions((p) => [...p, '']);
    };
    const removePollOption = (i) => {
        if (pollOptions.length > 2) setPollOptions((p) => p.filter((_, idx) => idx !== i));
    };
    const setPollOption = (i, val) => {
        setPollOptions((p) => {
            const n = [...p];
            n[i] = val;
            return n;
        });
    };

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
        if (!data.content?.trim() && !mediaFile && !hasPoll) {
            toast.error('Please add content, media, or a poll');
            return;
        }
        if (pollMode && (!pollQuestion.trim() || pollOptions.filter((o) => o.trim()).length < 2)) {
            toast.error('Poll needs a question and at least 2 options');
            return;
        }
        try {
            let payload;
            if (mediaFile) {
                payload = new FormData();
                payload.append('content', data.content || '');
                payload.append('visibility', data.visibility || 'public');
                payload.append('media', mediaFile);
                if (pollMode && pollQuestion.trim()) {
                    payload.append('poll[question]', pollQuestion.trim());
                    pollOptions.filter((o) => o.trim()).forEach((o, i) => payload.append(`poll[options][${i}]`, o.trim()));
                }
            } else {
                payload = {
                    content: data.content || '',
                    visibility: data.visibility || 'public',
                };
                if (pollMode && pollQuestion.trim()) {
                    payload.poll = {
                        question: pollQuestion.trim(),
                        options: pollOptions.filter((o) => o.trim()),
                    };
                }
            }
            await createPostMutation.mutateAsync({ formData: payload });
            reset();
            if (mediaPreview && mediaType === 'video') {
                URL.revokeObjectURL(mediaPreview);
            }
            setMediaPreview(null);
            setMediaFile(null);
            setMediaType(null);
            setPollMode(false);
            setPollQuestion('');
            setPollOptions(['', '']);
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

    const containerClasses =
        variant === 'modal'
            ? 'rounded-2xl p-5 bg-white dark:bg-[var(--theme-surface)] border border-[var(--theme-border)] shadow-sm'
            : 'bg-white dark:bg-[var(--theme-surface)] rounded-2xl p-5 mb-4 shadow-sm shadow-black/5 border border-black/[0.06] dark:border-white/[0.06]';

    return (
        <div className={containerClasses}>
            {variant === 'feed' && (
                <p className="text-center text-sm font-semibold text-[var(--text-primary)] pb-3 mb-4 border-b border-[var(--theme-border)]">
                    Create Post
                </p>
            )}
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="flex items-start gap-4">
                    <Avatar src={user?.profile_picture} alt={user?.name} size="lg" className="w-11 h-11 shrink-0 rounded-full" />
                    <div className="flex-1 min-w-0 space-y-4">
                        <textarea
                            {...register('content')}
                            placeholder="Share a thought, a photo, or a poll..."
                            onFocus={() => setIsExpanded(true)}
                            rows={2}
                            className="w-full bg-gray-50 dark:bg-white/5 border border-[var(--theme-border)] rounded-xl px-3 py-2.5 text-sm leading-relaxed resize-none min-h-[100px] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/30 focus:border-[var(--theme-accent)]/40 transition-all mt-3"
                        />

                        {mediaPreview && (
                            <div className="relative mt-3 rounded-xl overflow-hidden border border-[var(--theme-border)] bg-black/5 dark:bg-white/5">
                                {mediaType === 'image' ? (
                                    <img src={mediaPreview} alt="Preview" className="w-full max-h-72 object-cover" />
                                ) : (
                                    <video src={mediaPreview} controls className="w-full max-h-72" />
                                )}
                                <button
                                    type="button"
                                    onClick={removeMedia}
                                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full w-7 h-7 flex items-center justify-center transition-colors"
                                >
                                    <UilTimes size={14} color="white" />
                                </button>
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-[var(--theme-border)]">
                            <div className="flex items-center gap-2">
                                <label htmlFor={mediaInputId} className="p-2 rounded-xl hover:bg-[var(--theme-surface-hover)] text-[var(--theme-accent)] cursor-pointer transition-colors" title="Add photo or video">
                                    <span className="material-symbols-outlined">image</span>
                                    <input ref={mediaInputRef} type="file" id={mediaInputId} accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
                                </label>
                                <button type="button" onClick={() => mediaInputRef.current?.click()} className="p-2 rounded-xl hover:bg-[var(--theme-surface-hover)] text-[var(--theme-accent)] transition-colors" title="Add video">
                                    <span className="material-symbols-outlined">videocam</span>
                                </button>
                                <button type="button" className="p-2 rounded-xl hover:bg-[var(--theme-surface-hover)] text-[var(--theme-accent)] transition-colors">
                                    <span className="material-symbols-outlined">sentiment_satisfied</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPollMode((p) => !p)}
                                    className={`p-2 rounded-xl transition-colors ${pollMode ? 'bg-[var(--theme-accent)]/20 text-[var(--theme-accent)]' : 'hover:bg-[var(--theme-surface-hover)] text-[var(--theme-accent)]'}`}
                                    title="Add poll"
                                >
                                    <span className="material-symbols-outlined">equalizer</span>
                                </button>
                            </div>
                            <button
                                type="submit"
                                disabled={!isFormValid || createPostMutation.isPending}
                                className="bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white h-10 px-6 rounded-full font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {createPostMutation.isPending ? '...' : 'Post'}
                            </button>
                        </div>
                    </div>
                </div>

                {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-[var(--theme-border)] flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-6">
                            <span className="text-sm text-[var(--text-secondary)]">Who can see this?</span>
                            <label className="flex items-center gap-1.5 cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm">
                                <input type="radio" value="public" {...register('visibility')} className="text-[var(--theme-accent)]" />
                                <UilGlobe size={16} color="currentColor" />
                                Public
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm">
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

                {pollMode && (
                    <div className="mt-4 p-4 rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)] space-y-3">
                        <input
                            type="text"
                            value={pollQuestion}
                            onChange={(e) => setPollQuestion(e.target.value)}
                            placeholder="Ask a question..."
                            className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-[var(--theme-border)] text-[var(--text-primary)] placeholder:[color:var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]"
                        />
                        <div className="space-y-2">
                            {pollOptions.map((opt, i) => (
                                <div key={i} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => setPollOption(i, e.target.value)}
                                        placeholder={`Option ${i + 1}`}
                                        className="flex-1 px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-[var(--theme-border)] text-[var(--text-primary)] placeholder:[color:var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removePollOption(i)}
                                        disabled={pollOptions.length <= 2}
                                        className="p-2 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <span className="material-symbols-outlined text-xl">close</span>
                                    </button>
                                </div>
                            ))}
                            {pollOptions.length < 5 && (
                                <button
                                    type="button"
                                    onClick={addPollOption}
                                    className="text-sm text-[var(--theme-accent)] hover:underline"
                                >
                                    Add option
                                </button>
                            )}
                        </div>
                    </div>
                )}

            </form>
        </div>
    );
};

export default PostInput;
