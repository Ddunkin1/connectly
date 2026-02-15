import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useUpdateProfile } from '../hooks/useUsers';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';

const inputBase = 'w-full px-4 py-3 rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent transition-all';

const EditProfile = () => {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const updateMutation = useUpdateProfile();
    
    const [profilePicture, setProfilePicture] = useState(null);
    const [profilePreview, setProfilePreview] = useState(user?.profile_picture || null);
    const [coverImage, setCoverImage] = useState(null);
    const [coverPreview, setCoverPreview] = useState(user?.cover_image || null);
    
    const profileFileInputRef = useRef(null);
    const coverFileInputRef = useRef(null);

    const { register, handleSubmit, watch, formState: { errors } } = useForm({
        defaultValues: {
            name: user?.name || '',
            username: user?.username || '',
            bio: user?.bio || '',
            location: user?.location || '',
            website: user?.website || '',
            privacy_settings: user?.privacy_settings || 'public',
        },
    });

    const bio = watch('bio', '');

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
            navigate(`/profile/${data.username}`);
        } catch (error) {
            // Error handled by mutation
        }
    };

    return (
        <div className="max-w-2xl mx-auto pb-12">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">Edit Profile</h1>
                <p className="text-sm text-[var(--text-secondary)] mt-1">Update your profile information</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="overflow-hidden rounded-2xl theme-surface border border-[var(--theme-border)]">
                {/* Cover + Avatar hero */}
                <div className="relative">
                    <div
                        className="h-40 sm:h-48 w-full cursor-pointer group relative overflow-hidden"
                        style={{
                            background: coverPreview
                                ? `url(${coverPreview}) center/cover`
                                : 'linear-gradient(135deg, var(--theme-accent) 0%, color-mix(in srgb, var(--theme-accent) 60%, #6366f1) 100%)',
                        }}
                        onClick={() => coverFileInputRef.current?.click()}
                    >
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                            <span className="material-symbols-outlined text-white/0 group-hover:text-white/90 text-3xl transition-all">photo_camera</span>
                        </div>
                        <input ref={coverFileInputRef} type="file" accept="image/*" onChange={handleCoverImageChange} className="hidden" />
                    </div>
                    <div
                        className="absolute -bottom-14 left-6 w-28 h-28 rounded-2xl overflow-hidden cursor-pointer group border-4 border-[var(--theme-surface)] shadow-xl bg-[var(--theme-surface-hover)]"
                        onClick={() => profileFileInputRef.current?.click()}
                    >
                        {profilePreview ? (
                            <img src={profilePreview} alt={user?.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white text-3xl font-semibold" style={{ backgroundColor: 'var(--theme-accent)' }}>
                                {(user?.name?.[0] || '?').toUpperCase()}
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center">
                            <span className="material-symbols-outlined text-white/0 group-hover:text-white text-2xl transition-all">photo_camera</span>
                        </div>
                        <input ref={profileFileInputRef} type="file" accept="image/*" onChange={handleProfilePictureChange} className="hidden" />
                    </div>
                </div>

                {/* Form fields */}
                <div className="pt-20 px-6 pb-6 space-y-5">
                    <p className="text-xs text-[var(--text-secondary)]">Cover & avatar: 1500×500px and square, max 5MB each</p>

                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Full Name</label>
                        <input {...register('name', { required: 'Name is required' })} type="text" id="name" className={inputBase} placeholder="Your name" />
                        {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
                    </div>

                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Username</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">@</span>
                            <input
                                {...register('username', {
                                    required: 'Username is required',
                                    pattern: { value: /^[a-zA-Z0-9_]+$/, message: 'Letters, numbers, underscores only' },
                                })}
                                type="text"
                                id="username"
                                className={`${inputBase} pl-8`}
                                placeholder="username"
                            />
                        </div>
                        {errors.username && <p className="text-xs text-red-400 mt-1">{errors.username.message}</p>}
                    </div>

                    <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Bio</label>
                        <textarea
                            {...register('bio', { maxLength: { value: 500, message: 'Max 500 characters' } })}
                            id="bio"
                            rows={4}
                            className={`${inputBase} resize-none`}
                            placeholder="Tell people about yourself..."
                        />
                        <div className="flex justify-between mt-1">
                            {errors.bio ? <p className="text-xs text-red-400">{errors.bio.message}</p> : <span />}
                            <span className="text-xs text-[var(--text-secondary)]">{bio.length}/500</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="location" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Location</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-lg">location_on</span>
                                <input {...register('location')} type="text" id="location" className={`${inputBase} pl-10`} placeholder="City, Country" />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="website" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Website</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-lg">link</span>
                                <input
                                    {...register('website', { pattern: { value: /^(https?:\/\/.+|)$/, message: 'Please enter a valid URL' } })}
                                    type="url"
                                    id="website"
                                    className={`${inputBase} pl-10`}
                                    placeholder="https://"
                                />
                            </div>
                            {errors.website && <p className="text-xs text-red-400 mt-1">{errors.website.message}</p>}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="privacy_settings" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Privacy</label>
                        <select {...register('privacy_settings')} id="privacy_settings" className={inputBase}>
                            <option value="public">Public — Anyone can see your profile</option>
                            <option value="private">Private — Only you and approved followers</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-[var(--theme-border)]">
                        <Button type="button" variant="ghost" onClick={() => navigate(`/profile/${user?.username}`)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={updateMutation.isPending} loading={updateMutation.isPending}>
                            Save Changes
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default EditProfile;
