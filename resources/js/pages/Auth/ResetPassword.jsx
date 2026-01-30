import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useResetPassword } from '../../hooks/useAuth';
import Button from '../../components/common/Button';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const resetMutation = useResetPassword();
    const [showPassword, setShowPassword] = useState(false);
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm();

    useEffect(() => {
        if (email) setValue('email', email);
    }, [email, setValue]);

    const onSubmit = (data) => {
        resetMutation.mutate(
            { ...data, token },
            {
                onSuccess: () => {
                    navigate('/login', { replace: true });
                },
            }
        );
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid or missing link</h1>
                    <p className="text-gray-600 mb-6">
                        This reset link is invalid or has expired. Please request a new one.
                    </p>
                    <Link
                        to="/forgot-password"
                        className="inline-block text-[#359EFF] font-semibold hover:underline"
                    >
                        Request new reset link
                    </Link>
                    <span className="mx-2 text-gray-400">|</span>
                    <Link to="/login" className="inline-block text-[#359EFF] font-semibold hover:underline">
                        Back to sign in
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex">
            {/* Left Panel */}
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
                        <h2 className="text-4xl font-bold mb-4">Set a new password</h2>
                        <p className="text-lg text-white/90 leading-relaxed">
                            Choose a strong password to keep your account secure.
                        </p>
                    </div>
                    <div className="text-sm text-white/80">
                        © 2024 Connectly Inc. All rights reserved.
                    </div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-4 py-12">
                <div className="w-full max-w-md">
                    <div className="lg:hidden flex items-center justify-center mb-8">
                        <div className="w-10 h-10 bg-[#359EFF] rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">C</span>
                        </div>
                        <span className="ml-2 text-xl font-bold text-gray-900">Connectly</span>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">New password</h1>
                        <p className="text-gray-600">Enter your new password below.</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
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
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#359EFF] focus:border-transparent transition-colors bg-gray-50"
                                placeholder="name@company.com"
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    {...register('password', {
                                        required: 'Password is required',
                                        minLength: {
                                            value: 8,
                                            message: 'Password must be at least 8 characters',
                                        },
                                    })}
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#359EFF] focus:border-transparent transition-colors pr-12"
                                    placeholder="Enter new password"
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
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm Password
                            </label>
                            <input
                                {...register('password_confirmation', {
                                    required: 'Please confirm your password',
                                    validate: (value, formValues) =>
                                        value === formValues.password || 'Passwords do not match',
                                })}
                                type="password"
                                id="password_confirmation"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#359EFF] focus:border-transparent transition-colors"
                                placeholder="Confirm new password"
                            />
                            {errors.password_confirmation && (
                                <p className="mt-1 text-sm text-red-600">{errors.password_confirmation.message}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-[#359EFF] hover:bg-[#2a8eef] text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
                            disabled={resetMutation.isPending}
                            loading={resetMutation.isPending}
                        >
                            <span>Reset password</span>
                            <span className="material-symbols-outlined text-xl">arrow_forward</span>
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link to="/login" className="text-sm text-[#359EFF] font-semibold hover:underline">
                            Back to sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
