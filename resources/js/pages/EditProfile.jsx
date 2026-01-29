import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useUpdateProfile } from '../hooks/useUsers';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';

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

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
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
        reader.onloadend = () => {
            setProfilePreview(reader.result);
        };
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
        reader.onloadend = () => {
            setCoverPreview(reader.result);
        };
        reader.readAsDataURL(file);
        setCoverImage(file);
    };

    const onSubmit = async (data) => {
        try {
            // Create FormData for file uploads
            const formData = new FormData();
            formData.append('name', data.name);
            formData.append('username', data.username);
            formData.append('bio', data.bio || '');
            formData.append('location', data.location || '');
            formData.append('website', data.website || '');
            formData.append('privacy_settings', data.privacy_settings);
            
            if (profilePicture) {
                formData.append('profile_picture', profilePicture);
            }
            
            if (coverImage) {
                formData.append('cover_image', coverImage);
            }

            await updateMutation.mutateAsync(formData);
            navigate(`/profile/${data.username}`);
        } catch (error) {
            // Error handled by mutation
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
                <p className="text-gray-500 mt-1">Update your profile information</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
                {/* Cover Image */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
                    <div className="relative">
                        <div 
                            className="h-48 rounded-lg bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 cursor-pointer hover:opacity-90 transition-opacity"
                            style={{
                                backgroundImage: coverPreview ? `url(${coverPreview})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                            onClick={() => coverFileInputRef.current?.click()}
                        >
                        </div>
                        <input
                            ref={coverFileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/jpg,image/webp"
                            onChange={handleCoverImageChange}
                            className="hidden"
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Recommended: 1500x500px, max 5MB</p>
                </div>

                {/* Profile Picture */}
                <div className="flex flex-col items-center">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
                    <div className="relative">
                        <div 
                            className="w-32 h-32 rounded-full border-4 border-white shadow-lg cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => profileFileInputRef.current?.click()}
                        >
                            <Avatar src={profilePreview} alt={user?.name} size="2xl" className="w-full h-full" />
                        </div>
                        <input
                            ref={profileFileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/jpg,image/webp"
                            onChange={handleProfilePictureChange}
                            className="hidden"
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Recommended: Square JPG or PNG, max 5MB</p>
                </div>

                {/* Name */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                    </label>
                    <input
                        {...register('name', { required: 'Name is required' })}
                        type="text"
                        id="name"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#359EFF]"
                    />
                    {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
                </div>

                {/* Username */}
                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                        Username
                    </label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                        <input
                            {...register('username', { 
                                required: 'Username is required',
                                pattern: {
                                    value: /^[a-zA-Z0-9_]+$/,
                                    message: 'Username can only contain letters, numbers, and underscores'
                                }
                            })}
                            type="text"
                            id="username"
                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#359EFF]"
                        />
                    </div>
                    {errors.username && <p className="text-sm text-red-600 mt-1">{errors.username.message}</p>}
                </div>

                {/* Bio */}
                <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                    </label>
                    <textarea
                        {...register('bio', { maxLength: { value: 500, message: 'Bio must be less than 500 characters' } })}
                        id="bio"
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#359EFF] resize-none"
                        placeholder="Tell us about yourself..."
                    />
                    <div className="flex justify-between mt-1">
                        {errors.bio && <p className="text-sm text-red-600">{errors.bio.message}</p>}
                        <p className="text-xs text-gray-500 ml-auto">{bio.length}/500</p>
                    </div>
                </div>

                {/* Location */}
                <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                        Location
                    </label>
                    <input
                        {...register('location')}
                        type="text"
                        id="location"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#359EFF]"
                        placeholder="City, Country"
                    />
                </div>

                {/* Website */}
                <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                        Website
                    </label>
                    <input
                        {...register('website', { 
                            pattern: {
                                value: /^https?:\/\/.+/,
                                message: 'Please enter a valid URL starting with http:// or https://'
                            }
                        })}
                        type="url"
                        id="website"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#359EFF]"
                        placeholder="https://example.com"
                    />
                    {errors.website && <p className="text-sm text-red-600 mt-1">{errors.website.message}</p>}
                </div>

                {/* Privacy Settings */}
                <div>
                    <label htmlFor="privacy_settings" className="block text-sm font-medium text-gray-700 mb-2">
                        Privacy Settings
                    </label>
                    <select
                        {...register('privacy_settings')}
                        id="privacy_settings"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#359EFF]"
                    >
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                    </select>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => navigate(`/profile/${user?.username}`)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={updateMutation.isPending}
                        loading={updateMutation.isPending}
                    >
                        Save Changes
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default EditProfile;
