import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useRegister } from '../../hooks/useAuth';
import { validateUsername } from '../../utils/validateForm';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Register = () => {
    const navigate = useNavigate();
    const registerMutation = useRegister();
    const [currentStep, setCurrentStep] = useState(1);
    const [profilePicture, setProfilePicture] = useState(null);
    const [profilePreview, setProfilePreview] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const fileInputRef = useRef(null);
    
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm();

    const password = watch('password');
    const bio = watch('bio', '');

    // Password strength checker
    const getPasswordStrength = (pwd) => {
        if (!pwd) return { strength: 0, label: '', color: '' };
        
        let strength = 0;
        let checks = {
            length: pwd.length >= 8,
            lowercase: /[a-z]/.test(pwd),
            uppercase: /[A-Z]/.test(pwd),
            number: /[0-9]/.test(pwd),
            special: /[^a-zA-Z0-9]/.test(pwd),
        };

        strength = Object.values(checks).filter(Boolean).length;

        if (strength <= 2) {
            return { strength, label: 'Weak', color: 'red' };
        } else if (strength <= 4) {
            return { strength, label: 'Medium', color: 'yellow' };
        } else {
            return { strength, label: 'Strong', color: 'green' };
        }
    };

    const passwordStrength = getPasswordStrength(password);

    // Helper function to check if step 1 is valid
    const isStep1Valid = () => {
        const name = watch('name');
        const email = watch('email');
        const password = watch('password');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const passwordStrength = password ? getPasswordStrength(password) : { strength: 0 };
        
        return name && email && password && emailRegex.test(email) && password.length >= 8 && passwordStrength.strength >= 3;
    };

    // Helper function to get missing fields for step 1
    const getMissingFieldsStep1 = () => {
        const name = watch('name');
        const email = watch('email');
        const password = watch('password');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const passwordStrength = password ? getPasswordStrength(password) : { strength: 0 };
        const missingFields = [];
        
        if (!name || name.trim() === '') missingFields.push('Full Name');
        if (!email || email.trim() === '' || !emailRegex.test(email)) missingFields.push('Email Address');
        if (!password || password.length < 8 || passwordStrength.strength < 3) missingFields.push('Strong Password');
        
        return missingFields;
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB');
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setProfilePreview(reader.result);
        };
        reader.readAsDataURL(file);
        setProfilePicture(file);
    };


    const handleNext = () => {
        if (currentStep === 1) {
            // Validate step 1 fields
            const name = watch('name');
            const email = watch('email');
            const password = watch('password');

            // Check email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            // Check password strength (must be at least medium/strong)
            const strength = getPasswordStrength(password);

            // Get missing fields for toast message
            const missingFields = getMissingFieldsStep1();

            // Show toast if validation fails
            if (missingFields.length > 0) {
                toast.error(`Please fill in: ${missingFields.join(', ')}`, {
                    duration: 4000,
                    position: 'top-center',
                });
                return;
            }

            // Basic validation - react-hook-form will show errors
            if (name && email && password && emailRegex.test(email) && strength.strength >= 3) {
                setIsNavigating(true);
                setTimeout(() => {
                    setCurrentStep(2);
                    setIsNavigating(false);
                }, 300);
            }
        } else if (currentStep === 2) {
            // Validate step 2 fields
            const username = watch('username');
            
            // Check if username is filled
            if (!username || username.trim() === '') {
                toast.error('Please fill in your username before proceeding.', {
                    duration: 4000,
                    position: 'top-center',
                });
                return;
            }
            
            // Validate username format
            if (!validateUsername(username)) {
                toast.error('Username can only contain letters, numbers, and underscores.', {
                    duration: 4000,
                    position: 'top-center',
                });
                return;
            }
            
            // Check username length
            if (username.length < 3) {
                toast.error('Username must be at least 3 characters.', {
                    duration: 4000,
                    position: 'top-center',
                });
                return;
            }
            
            if (username.length > 30) {
                toast.error('Username must be less than 30 characters.', {
                    duration: 4000,
                    position: 'top-center',
                });
                return;
            }
            
            // Proceed to next step
            setIsNavigating(true);
            setTimeout(() => {
                setCurrentStep(3);
                setIsNavigating(false);
            }, 300);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const onSubmit = async (data) => {
        try {
            const formData = new FormData();
            formData.append('name', data.name);
            formData.append('email', data.email);
            formData.append('password', data.password);
            formData.append('username', data.username);
            formData.append('bio', data.bio || '');
            
            // Add profile picture file if selected
            if (profilePicture) {
                formData.append('profile_picture', profilePicture);
            }

            await registerMutation.mutateAsync(formData);
            navigate('/home');
        } catch (error) {
            // Error handled by mutation
        }
    };

    const getProgressPercentage = () => {
        return (currentStep / 3) * 100;
    };

    const renderStepContent = () => {
        if (currentStep === 1) {
            return (
                <>
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-[#359EFF]">Step 1 of 3</span>
                            <span className="text-sm text-gray-500">{Math.round(getProgressPercentage())}% Complete</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div
                                className="bg-[#359EFF] h-2 rounded-full transition-all duration-300"
                                style={{ width: `${getProgressPercentage()}%` }}
                            />
                        </div>
                        <p className="text-sm text-gray-600">Basic Information</p>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h1>
                        <p className="text-gray-600">Join the Connectly community and start sharing.</p>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-5">
                        <div className="space-y-2">
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Full Name
                            </label>
                            <input
                                {...register('name', { required: 'Full name is required' })}
                                type="text"
                                id="name"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#359EFF] focus:border-transparent transition-colors"
                                placeholder="Enter your full name"
                            />
                            <div className="h-5">
                                {errors.name && (
                                    <p className="text-sm text-red-600">{errors.name.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email Address
                            </label>
                            <input
                                {...register('email', {
                                    required: 'Email is required',
                                    pattern: {
                                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                        message: 'Invalid email address',
                                    },
                                })}
                                type="email"
                                id="email"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#359EFF] focus:border-transparent transition-colors"
                                placeholder="name@company.com"
                            />
                            <div className="h-5">
                                {errors.email && (
                                    <p className="text-sm text-red-600">{errors.email.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Create Password
                            </label>
                            <div className="relative">
                                <input
                                    {...register('password', {
                                        required: 'Password is required',
                                        minLength: {
                                            value: 8,
                                            message: 'Password must be at least 8 characters',
                                        },
                                        validate: (value) => {
                                            const strength = getPasswordStrength(value);
                                            if (strength.strength < 3) {
                                                return 'Password must be stronger (include uppercase, lowercase, number, and special character)';
                                            }
                                            return true;
                                        },
                                    })}
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#359EFF] focus:border-transparent transition-colors pr-12 ${
                                        password 
                                            ? passwordStrength.color === 'green' 
                                                ? 'border-green-500' 
                                                : passwordStrength.color === 'yellow'
                                                ? 'border-yellow-500'
                                                : 'border-red-500'
                                            : 'border-gray-300'
                                    }`}
                                    placeholder="At least 8 characters"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                >
                                    <span className="material-symbols-outlined text-xl">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                            
                            {/* Password Strength Indicator - Fixed Height Container */}
                            <div className="mt-2 min-h-[120px]">
                                {password && (
                                    <div>
                                        <div className="flex items-center space-x-2 mb-1">
                                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-300 ${
                                                        passwordStrength.color === 'green'
                                                            ? 'bg-green-500'
                                                            : passwordStrength.color === 'yellow'
                                                            ? 'bg-yellow-500'
                                                            : 'bg-red-500'
                                                    }`}
                                                    style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                                                />
                                            </div>
                                            <span
                                                className={`text-xs font-medium ${
                                                    passwordStrength.color === 'green'
                                                        ? 'text-green-600'
                                                        : passwordStrength.color === 'yellow'
                                                        ? 'text-yellow-600'
                                                        : 'text-red-600'
                                                }`}
                                            >
                                                {passwordStrength.label}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                                            <div className={`flex items-center space-x-1 ${
                                                password.length >= 8 ? 'text-green-600' : 'text-gray-400'
                                            }`}>
                                                <span className="material-symbols-outlined text-sm">
                                                    {password.length >= 8 ? 'check_circle' : 'radio_button_unchecked'}
                                                </span>
                                                <span>8+ characters</span>
                                            </div>
                                            <div className={`flex items-center space-x-1 ${
                                                /[a-z]/.test(password) ? 'text-green-600' : 'text-gray-400'
                                            }`}>
                                                <span className="material-symbols-outlined text-sm">
                                                    {/[a-z]/.test(password) ? 'check_circle' : 'radio_button_unchecked'}
                                                </span>
                                                <span>Lowercase</span>
                                            </div>
                                            <div className={`flex items-center space-x-1 ${
                                                /[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-400'
                                            }`}>
                                                <span className="material-symbols-outlined text-sm">
                                                    {/[A-Z]/.test(password) ? 'check_circle' : 'radio_button_unchecked'}
                                                </span>
                                                <span>Uppercase</span>
                                            </div>
                                            <div className={`flex items-center space-x-1 ${
                                                /[0-9]/.test(password) ? 'text-green-600' : 'text-gray-400'
                                            }`}>
                                                <span className="material-symbols-outlined text-sm">
                                                    {/[0-9]/.test(password) ? 'check_circle' : 'radio_button_unchecked'}
                                                </span>
                                                <span>Number</span>
                                            </div>
                                            <div className={`flex items-center space-x-1 col-span-2 ${
                                                /[^a-zA-Z0-9]/.test(password) ? 'text-green-600' : 'text-gray-400'
                                            }`}>
                                                <span className="material-symbols-outlined text-sm">
                                                    {/[^a-zA-Z0-9]/.test(password) ? 'check_circle' : 'radio_button_unchecked'}
                                                </span>
                                                <span>Special character</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="mt-1 min-h-[20px]">
                                {errors.password && (
                                    <p className="text-sm text-red-600">{errors.password.message}</p>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!isStep1Valid()}
                            className={`w-full font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                                !isStep1Valid()
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-[#359EFF] hover:bg-[#2a8eef] text-white'
                            }`}
                        >
                            <span>Next</span>
                            <span className="material-symbols-outlined text-xl">arrow_forward</span>
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-gray-500 font-medium">OR CONTINUE WITH</span>
                        </div>
                    </div>

                    {/* Google Sign In */}
                    <a
                        href={`${import.meta.env.VITE_API_URL || '/api'}/auth/google`}
                        className="w-full flex items-center justify-center space-x-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700 no-underline"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        <span>Continue with Google</span>
                    </a>

                    {/* Facebook Sign In */}
                    <a
                        href={`${import.meta.env.VITE_API_URL || '/api'}/auth/facebook`}
                        className="w-full flex items-center justify-center space-x-3 px-4 py-3 mt-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700 no-underline"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        <span>Continue with Facebook</span>
                    </a>
                </>
            );
        }

        if (currentStep === 2) {
            return (
                <>
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-[#359EFF]">Step 2 of 3</span>
                            <span className="text-sm text-gray-500">{Math.round(getProgressPercentage())}% Complete</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div
                                className="bg-[#359EFF] h-2 rounded-full transition-all duration-300"
                                style={{ width: `${getProgressPercentage()}%` }}
                            />
                        </div>
                        <p className="text-sm text-gray-600">Profile Setup</p>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tell us about yourself</h1>
                        <p className="text-gray-600">Create your identity on Connectly.</p>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-6">
                        {/* Profile Picture Upload */}
                        <div className="flex flex-col items-center">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden cursor-pointer hover:border-[#359EFF] transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {profilePreview ? (
                                        <img src={profilePreview} alt="Profile preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="material-symbols-outlined text-5xl text-gray-400">
                                            person
                                        </span>
                                    )}
                                </div>
                                <div
                                    className="absolute bottom-0 right-0 w-10 h-10 bg-[#359EFF] rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#2a8eef] transition-colors shadow-lg"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <span className="material-symbols-outlined text-white text-xl">camera_alt</span>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/jpg,image/webp"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </div>
                            <p className="mt-4 text-sm font-medium text-gray-700">Upload Profile Picture</p>
                            <p className="mt-1 text-xs text-gray-500">Recommended: Square JPG or PNG, max 5MB</p>
                        </div>

                        {/* Username */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                                Username
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">@</span>
                                <input
                                    {...register('username', {
                                        required: 'Username is required',
                                        validate: (value) =>
                                            validateUsername(value) ||
                                            'Username can only contain letters, numbers, and underscores',
                                        minLength: {
                                            value: 3,
                                            message: 'Username must be at least 3 characters',
                                        },
                                        maxLength: {
                                            value: 30,
                                            message: 'Username must be less than 30 characters',
                                        },
                                    })}
                                    type="text"
                                    id="username"
                                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#359EFF] focus:border-transparent transition-colors"
                                    placeholder="janesmith"
                                    onChange={(e) => {
                                        setValue('username', e.target.value);
                                    }}
                                />
                            </div>
                            <div className="h-5">
                                {errors.username && (
                                    <p className="text-sm text-red-600">{errors.username.message}</p>
                                )}
                            </div>
                            <p className="mt-1 text-sm text-gray-500">This will be your unique handle on the platform.</p>
                        </div>

                        {/* Bio */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                                    Bio
                                </label>
                                <span className="text-xs text-gray-500">{bio?.length || 0}/160</span>
                            </div>
                            <textarea
                                {...register('bio', {
                                    maxLength: {
                                        value: 160,
                                        message: 'Bio must be less than 160 characters',
                                    },
                                })}
                                id="bio"
                                rows={4}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#359EFF] focus:border-transparent transition-colors resize-none"
                                placeholder="Share a bit about who you are..."
                                maxLength={160}
                            />
                            <div className="h-5">
                                {errors.bio && (
                                    <p className="text-sm text-red-600">{errors.bio.message}</p>
                                )}
                            </div>
                            <p className="mt-1 text-sm text-gray-500">A short introduction for your profile.</p>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between pt-4">
                            <button
                                type="button"
                                onClick={handleBack}
                                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                            >
                                <span className="material-symbols-outlined">arrow_back</span>
                                <span>Back</span>
                            </button>
                            <button
                                type="submit"
                                disabled={!watch('username') || watch('username')?.trim() === '' || isNavigating}
                                className={`font-semibold py-3 px-6 rounded-lg transition-colors flex items-center space-x-2 ${
                                    !watch('username') || watch('username')?.trim() === '' || isNavigating
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-[#359EFF] hover:bg-[#2a8eef] text-white'
                                }`}
                            >
                                {isNavigating ? (
                                    <>
                                        <LoadingSpinner size="sm" />
                                        <span>Loading...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Next Step</span>
                                        <span className="material-symbols-outlined">arrow_forward</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </>
            );
        }

        if (currentStep === 3) {
            return (
                <>
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-[#359EFF]">Step 3 of 3</span>
                            <span className="text-sm text-gray-500">{Math.round(getProgressPercentage())}% Complete</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div
                                className="bg-[#359EFF] h-2 rounded-full transition-all duration-300"
                                style={{ width: `${getProgressPercentage()}%` }}
                            />
                        </div>
                        <p className="text-sm text-gray-600">Complete</p>
                    </div>

                    <div className="mb-8 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-green-600 text-4xl">check_circle</span>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">You're all set!</h1>
                        <p className="text-gray-600">Review your information and complete your registration.</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Full Name</p>
                                <p className="text-sm font-medium text-gray-900">{watch('name')}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Email</p>
                                <p className="text-sm font-medium text-gray-900">{watch('email')}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Username</p>
                                <p className="text-sm font-medium text-gray-900">@{watch('username')}</p>
                            </div>
                            {watch('bio') && (
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Bio</p>
                                    <p className="text-sm font-medium text-gray-900">{watch('bio')}</p>
                                </div>
                            )}
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between pt-4">
                            <button
                                type="button"
                                onClick={handleBack}
                                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                            >
                                <span className="material-symbols-outlined">arrow_back</span>
                                <span>Back</span>
                            </button>
                            <button
                                type="submit"
                                className={`font-semibold py-3 px-6 rounded-lg transition-colors flex items-center space-x-2 ${
                                    registerMutation.isPending
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-[#359EFF] hover:bg-[#2a8eef] text-white'
                                }`}
                                disabled={registerMutation.isPending}
                            >
                                {registerMutation.isPending ? (
                                    <>
                                        <LoadingSpinner size="sm" />
                                        <span>Creating Account...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Complete Registration</span>
                                        <span className="material-symbols-outlined">check</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </>
            );
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Promotional Section */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#359EFF] via-[#2a8eef] to-[#1e7dd6]">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-20"
                    style={{
                        backgroundImage: `url('https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80')`,
                    }}
                />
                <div className="relative z-10 flex flex-col justify-between p-12 text-white">
                    <div>
                        <div className="flex items-center space-x-2 mb-8">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg">
                                <span className="text-[#359EFF] font-bold text-xl">C</span>
                            </div>
                            <span className="text-2xl font-bold">Connectly</span>
                        </div>
                    </div>
                    <div className="max-w-md">
                        <h2 className="text-4xl font-bold mb-4">Your world, closer.</h2>
                        <p className="text-lg text-white/90 leading-relaxed">
                            Experience a new way to connect with the people and things you love. Secure, fast, and beautifully simple.
                        </p>
                    </div>
                    <div className="text-sm text-white/80">
                        © 2024 Connectly Inc. All rights reserved.
                    </div>
                </div>
            </div>

            {/* Right Panel - Registration Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-4 py-12 overflow-y-auto">
                <div className="w-full max-w-md">
                    {/* Logo for mobile */}
                    <div className="lg:hidden flex items-center justify-between mb-8">
                        <div className="flex items-center space-x-2">
                            <div className="w-10 h-10 bg-[#359EFF] rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-xl">C</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">Connectly</span>
                        </div>
                        <button className="text-[#359EFF] font-medium hover:underline">Help</button>
                    </div>

                    {renderStepContent()}

                    {/* Sign In Link - Only show on step 1 */}
                    {currentStep === 1 && (
                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600">
                                Already have an account?{' '}
                                <Link to="/login" className="text-[#359EFF] font-semibold hover:underline">
                                    Login
                                </Link>
                            </p>
                        </div>
                    )}

                    {/* Terms and Privacy - Only show on step 1 */}
                    {currentStep === 1 && (
                        <div className="mt-8 text-center">
                            <p className="text-xs text-gray-500">
                                BY JOINING, YOU AGREE TO OUR{' '}
                                <Link to="/terms" className="text-[#359EFF] hover:underline">
                                    TERMS OF SERVICE
                                </Link>{' '}
                                AND{' '}
                                <Link to="/privacy" className="text-[#359EFF] hover:underline">
                                    PRIVACY POLICY
                                </Link>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Register;
