import React from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useForgotPassword } from '../../hooks/useAuth';
import Button from '../../components/common/Button';

const ForgotPassword = () => {
    const forgotMutation = useForgotPassword();
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();

    const onSubmit = (data) => {
        forgotMutation.mutate(data);
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
                        <h2 className="text-4xl font-bold mb-4">Forgot your password?</h2>
                        <p className="text-lg text-white/90 leading-relaxed">
                            Enter your email and we&apos;ll send you a link to reset your password.
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
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset password</h1>
                        <p className="text-gray-600">Enter the email address associated with your account.</p>
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
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#359EFF] focus:border-transparent transition-colors"
                                placeholder="name@company.com"
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-[#359EFF] hover:bg-[#2a8eef] text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
                            disabled={forgotMutation.isPending}
                            loading={forgotMutation.isPending}
                        >
                            <span>Send reset link</span>
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

export default ForgotPassword;
