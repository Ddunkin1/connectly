import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useLogin, useTwoFactorChallenge, useLogout } from '../../hooks/useAuth';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';

const Login = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const loginMutation = useLogin();
    const twoFactorMutation = useTwoFactorChallenge();
    const logoutMutation = useLogout();
    const [showPassword, setShowPassword] = useState(false);
    const [showTwoFactor, setShowTwoFactor] = useState(false);
    const [twoFactorCode, setTwoFactorCode] = useState('');

    useEffect(() => {
        if (searchParams.get('verified') === '1') {
            toast.success('Your email has been verified. You can sign in now.');
        }
        const error = searchParams.get('error');
        if (error) {
            try {
                const decoded = decodeURIComponent(error);
                toast.error(decoded);
            } catch {
                toast.error('An error occurred during sign in.');
            }
        }
    }, [searchParams]);
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();

    const onSubmit = async (data) => {
        try {
            const res = await loginMutation.mutateAsync(data);
            if (res.data?.requires_two_factor) {
                setShowTwoFactor(true);
            } else {
                navigate('/home');
            }
        } catch (error) {
            const msg = error?.response?.data?.message || error?.message || 'Login failed. Please try again.';
            toast.error(msg);
        }
    };

    const onTwoFactorSubmit = async (e) => {
        e.preventDefault();
        try {
            await twoFactorMutation.mutateAsync(twoFactorCode);
            navigate('/home');
        } catch (error) {
            const msg = error?.response?.data?.message || error?.message || 'Verification failed. Please try again.';
            toast.error(msg);
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
                        <h2 className="text-4xl font-bold mb-4">Welcome back</h2>
                        <p className="text-lg text-white/90 leading-relaxed">
                            Sign in to continue your journey. Connect with friends, share moments, and discover what matters to you.
                        </p>
                    </div>
                    <div className="text-sm text-white/80">
                        © 2024 Connectly Inc. All rights reserved.
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="auth-form-panel w-full lg:w-1/2 flex items-center justify-center bg-white px-4 py-12">
                <div className="w-full max-w-md">
                    {/* Logo for mobile */}
                    <div className="lg:hidden flex items-center justify-center mb-8">
                        <div className="w-10 h-10 bg-[#359EFF] rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">C</span>
                        </div>
                        <span className="ml-2 text-xl font-bold text-gray-900">Connectly</span>
                    </div>

                    {/* Error banner from URL (e.g. Google OAuth redirect) */}
                    {searchParams.get('error') && (
                        <div
                            role="alert"
                            className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
                        >
                            {(() => {
                                try {
                                    return decodeURIComponent(searchParams.get('error'));
                                } catch {
                                    return 'An error occurred during sign in.';
                                }
                            })()}
                        </div>
                    )}

                    {/* Form Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {showTwoFactor ? 'Two-factor authentication' : 'Sign in to your account'}
                        </h1>
                        <p className="text-gray-600">
                            {showTwoFactor
                                ? 'Enter the 6-digit code from your authenticator app.'
                                : 'Welcome back! Please enter your details.'}
                        </p>
                    </div>

                    {showTwoFactor ? (
                        <form onSubmit={onTwoFactorSubmit} className="space-y-5">
                            <div>
                                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                                    Verification code
                                </label>
                                <input
                                    type="text"
                                    id="code"
                                    value={twoFactorCode}
                                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    maxLength={6}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#359EFF] focus:border-transparent text-center text-lg tracking-widest"
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={twoFactorCode.length !== 6 || twoFactorMutation.isPending}
                                className="w-full"
                            >
                                {twoFactorMutation.isPending ? 'Verifying...' : 'Verify'}
                            </Button>
                            <button
                                type="button"
                                onClick={() => {
                                    logoutMutation.mutate();
                                    setShowTwoFactor(false);
                                    setTwoFactorCode('');
                                }}
                                className="w-full text-sm text-gray-500 hover:text-gray-700"
                            >
                                Use different credentials
                            </button>
                        </form>
                    ) : (
                    <>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email or Username
                            </label>
                            <input
                                {...register('email', { required: 'Email or username is required' })}
                                type="text"
                                id="email"
                                autoComplete="username"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#359EFF] focus:border-transparent transition-colors"
                                placeholder="name@company.com or username"
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    {...register('password', { required: 'Password is required' })}
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#359EFF] focus:border-transparent transition-colors pr-12"
                                    placeholder="Enter your password"
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

                        <div className="flex items-center justify-between">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-gray-300 text-[#359EFF] focus:ring-[#359EFF] focus:ring-2"
                                />
                                <span className="ml-2 text-sm text-gray-600">Remember me</span>
                            </label>
                            <Link
                                to="/forgot-password"
                                className="text-sm text-[#359EFF] hover:underline font-medium"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-[#359EFF] hover:bg-[#2a8eef] text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
                            disabled={loginMutation.isPending}
                            loading={loginMutation.isPending}
                        >
                            <span>Sign In</span>
                            <span className="material-symbols-outlined text-xl">arrow_forward</span>
                        </Button>
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

                    {/* Sign Up Link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-[#359EFF] font-semibold hover:underline">
                                Sign up
                            </Link>
                        </p>
                    </div>
                    </>
                    )}

                    {/* Terms and Privacy */}
                    <div className="mt-8 text-center">
                        <p className="text-xs text-gray-500">
                            BY SIGNING IN, YOU AGREE TO OUR{' '}
                            <Link to="/terms" className="text-[#359EFF] hover:underline">
                                TERMS OF SERVICE
                            </Link>{' '}
                            AND{' '}
                            <Link to="/privacy" className="text-[#359EFF] hover:underline">
                                PRIVACY POLICY
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
