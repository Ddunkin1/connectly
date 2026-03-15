import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateProfile } from '../../hooks/useUsers';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import Button from '../common/Button';

const inputBase = 'w-full px-4 py-3 rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent transition-all';

const EditProfileForm = ({ onSuccess, onCancel }) => {
    const user = useAuthStore((state) => state.user);
    const updateMutation = useUpdateProfile();

    const [profilePicture, setProfilePicture] = useState(null);
    const [profilePreview, setProfilePreview] = useState(user?.profile_picture || null);
    const [coverImage, setCoverImage] = useState(null);
    const [coverPreview, setCoverPreview] = useState(user?.cover_image || null);

    const profileFileInputRef = useRef(null);
    const coverFileInputRef = useRef(null);

    const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
        defaultValues: {
            name: '',
            username: '',
            bio: '',
            location: '',
            website: '',
            privacy_settings: 'public',
        },
    });

    const bio = watch('bio', '');

    useEffect(() => {
        if (user) {
            reset({
                name: user.name || '',
                username: user.username || '',
                bio: user.bio || '',
                location: user.location || '',
                website: user.website || '',
                privacy_settings: user.privacy_settings || 'public',
            });
            setProfilePreview(user.profile_picture || null);
            setCoverPreview(user.cover_image || null);
        }
    }, [user, reset]);

    const handleProfilePictureChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => setProfilePreview(reader.result);
        reader.readAsDataURL(file);
        setProfilePicture(file);
    };

    const handleCoverImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => setCoverPreview(reader.result);
        reader.readAsDataURL(file);
        setCoverImage(file);
    };

    const onSubmit = async (data) => {
        try {
            const formData = new FormData();
            formData.append('name', data.name);
            formData.append('username', data.username);
            formData.append('bio', data.bio || '');
            formData.append('location', data.location || '');
            formData.append('website', data.website || '');
            formData.append('privacy_settings', data.privacy_settings);
            if (profilePicture) formData.append('profile_picture', profilePicture);
            if (coverImage) formData.append('cover_image', coverImage);
            await updateMutation.mutateAsync(formData);
            onSuccess();
        } catch (error) {
            // Error handled by mutation
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            {/* Cover + Avatar: stretched cover so image is visible; larger profile preview, centered */}
            <div className="relative">
                <div
                    className="h-40 sm:h-48 w-full cursor-pointer group relative overflow-hidden rounded-t-xl bg-cover bg-center"
                    style={{
                        backgroundImage: coverPreview
                            ? `url(${coverPreview})`
                            : 'linear-gradient(135deg, #4b5563 0%, #374151 50%, #1f2937 100%)',
                    }}
                    onClick={() => coverFileInputRef.current?.click()}
                >
                    {!coverPreview && (
                        <div
                            className="absolute inset-0 opacity-[0.03] pointer-events-none"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                            }}
                        />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex flex-col items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-white/0 group-hover:text-white/90 text-2xl transition-all">photo_camera</span>
                        <span className="text-white/0 group-hover:text-white/90 text-xs font-medium transition-all">Change cover</span>
                    </div>
                    <input ref={coverFileInputRef} type="file" accept="image/*" onChange={handleCoverImageChange} className="hidden" />
                </div>
                <div
                    className="absolute -bottom-16 w-32 h-32 rounded-full overflow-hidden cursor-pointer group border-4 border-[var(--theme-surface)] shadow-post-card bg-[var(--theme-surface-hover)] ring-2 ring-[var(--theme-border)]/50"
                    style={{ left: '50%', transform: 'translateX(-50%)' }}
                    onClick={() => profileFileInputRef.current?.click()}
                >
                    {profilePreview ? (
                        <img src={profilePreview} alt={user?.name} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-white text-3xl font-semibold" style={{ backgroundColor: 'var(--theme-accent)' }}>
                            {(user?.name?.[0] || '?').toUpperCase()}
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex flex-col items-center justify-center gap-0.5">
                        <span className="material-symbols-outlined text-white/0 group-hover:text-white text-2xl transition-all">photo_camera</span>
                        <span className="text-white/0 group-hover:text-white text-xs font-medium transition-all">Change photo</span>
                    </div>
                    <input ref={profileFileInputRef} type="file" accept="image/*" onChange={handleProfilePictureChange} className="hidden" />
                </div>
            </div>

            {/* Form fields */}
            <div className="pt-24 px-5 pb-6 space-y-5">
                <p className="text-[10px] text-[var(--text-secondary)] -mt-1">Cover 1500×500px, avatar square · max 5MB each</p>

                <section className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">About you</h4>
                    <div>
                        <label htmlFor="edit-name" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Full Name</label>
                    <input {...register('name', { required: 'Name is required' })} type="text" id="edit-name" className={inputBase} placeholder="Your name" />
                    {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
                </div>

                <div>
                    <label htmlFor="edit-username" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Username</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">@</span>
                        <input
                            {...register('username', {
                                required: 'Username is required',
                                pattern: { value: /^[a-zA-Z0-9_-]+$/, message: 'Letters, numbers, underscores and hyphens only' },
                            })}
                            type="text"
                            id="edit-username"
                            className={`${inputBase} pl-8`}
                            placeholder="username"
                        />
                    </div>
                    {errors.username && <p className="text-xs text-red-400 mt-1">{errors.username.message}</p>}
                </div>

                    <div>
                        <label htmlFor="edit-bio" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Bio</label>
                    <textarea
                        {...register('bio', { maxLength: { value: 500, message: 'Max 500 characters' } })}
                        id="edit-bio"
                        rows={3}
                        className={`${inputBase} resize-none leading-relaxed`}
                        placeholder="Tell people about yourself..."
                    />
                    <div className="flex flex-col gap-1 mt-1">
                        <div className="flex justify-between">
                            {errors.bio ? <p className="text-xs text-red-400">{errors.bio.message}</p> : <span />}
                            <span className="text-xs text-[var(--text-secondary)]">{bio.length}/500</span>
                        </div>
                        {bio.length > 0 && bio.length < 15 && (
                            <p className="text-xs text-[var(--text-secondary)]/80 italic">Add a few more words so others can get to know you.</p>
                        )}
                    </div>
                    </div>
                </section>

                <section className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label htmlFor="edit-location" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Location</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-lg">location_on</span>
                            <input {...register('location')} type="text" id="edit-location" className={`${inputBase} pl-10`} placeholder="City, Country" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="edit-website" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Website</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-lg">link</span>
                            <input
                                {...register('website', { pattern: { value: /^(https?:\/\/.+|)$/, message: 'Please enter a valid URL' } })}
                                type="url"
                                id="edit-website"
                                className={`${inputBase} pl-10`}
                                placeholder="https://"
                            />
                        </div>
                        {errors.website && <p className="text-xs text-red-400 mt-1">{errors.website.message}</p>}
                    </div>
                    </div>
                </section>

                <section className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Privacy</h4>
                    <div>
                        <label htmlFor="edit-privacy" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Who can see your profile</label>
                    <select {...register('privacy_settings')} id="edit-privacy" className={inputBase}>
                        <option value="public">Public — Anyone can see your profile</option>
                        <option value="private">Private — Only you and approved followers</option>
                    </select>
                    </div>
                </section>

                <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-[var(--theme-border)] pb-1">
                    <Button type="button" variant="ghost" onClick={onCancel} className="active:scale-[0.98]">
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" disabled={updateMutation.isPending} loading={updateMutation.isPending} className="active:scale-[0.98]">
                        Save Changes
                    </Button>
                </div>
            </div>
        </form>
    );
};

export default EditProfileForm;
