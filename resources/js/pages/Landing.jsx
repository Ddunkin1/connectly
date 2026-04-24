import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useLogin } from '../hooks/useAuth';
import AdminThemeToggle from '../components/admin/AdminThemeToggle';

const Landing = () => {
    const navigate = useNavigate();
    const loginMutation = useLogin();
    const [activeTab, setActiveTab] = useState('login');
    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState(null);
    
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();

    const onLoginSubmit = async (data) => {
        setLoginError(null);
        try {
            await loginMutation.mutateAsync(data);
            navigate('/home');
        } catch (error) {
            const res = error?.response?.data;
            const errs = res?.errors;
            const msg = errs?.email?.[0] ?? errs?.password?.[0] ?? res?.message ?? 'Invalid email/username or password.';
            setLoginError(msg);
        }
    };

    return (
        <div className="auth-form-panel member-canvas min-h-screen bg-[#f5f8ff] relative overflow-hidden">
            <div className="fixed top-4 right-4 z-50">
                <AdminThemeToggle />
            </div>
            <div className="member-orb pointer-events-none absolute -top-20 left-0 h-72 w-72 rounded-full bg-blue-400/25 blur-[95px]" />
            <div className="member-orb-slow pointer-events-none absolute top-1/2 -right-20 h-80 w-80 rounded-full bg-violet-400/25 blur-[105px]" />
            {/* Header */}
            <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-[#359EFF] rounded flex items-center justify-center">
                            <span className="text-white font-bold text-lg">C</span>
                        </div>
                        <span className="text-xl font-bold text-gray-900">Connectly</span>
                    </div>

                    {/* Navigation Links */}
                    <nav className="hidden md:flex items-center space-x-8">
                        <a href="#features" className="text-gray-700 hover:text-[#359EFF] transition-colors">Features</a>
                        <a href="#community" className="text-gray-700 hover:text-[#359EFF] transition-colors">Community</a>
                        <a href="#safety" className="text-gray-700 hover:text-[#359EFF] transition-colors">Safety</a>
                    </nav>

                    {/* Header Buttons */}
                    <div className="flex items-center space-x-4">
                        <Link to="/login" className="text-gray-700 hover:text-[#359EFF] font-medium transition-colors">
                            Log In
                        </Link>
                        <Link to="/register">
                            <button className="member-shimmer px-5 py-2 bg-[#359EFF] text-white rounded-xl font-medium hover:bg-[#2a8eef] transition-all duration-300 hover:-translate-y-[1px]">
                                Sign Up
                            </button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Left Side - Marketing Content */}
                    <div className="admin-fade-up">
                        <div className="inline-block mb-6">
                            <span className="px-4 py-1.5 bg-[#359EFF]/10 text-[#359EFF] rounded-full text-sm font-medium">
                                NOW IN BETA
                            </span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                            Social media that
                            <span className="block bg-gradient-to-r from-[#359EFF] via-violet-500 to-indigo-600 bg-clip-text text-transparent">
                                feels alive
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                            Join thousands of people building communities and chatting in real-time. Secure, fast, and free.
                        </p>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                            <Link to="/register">
                                <button className="member-shimmer px-8 py-3 bg-[#359EFF] text-white rounded-xl font-semibold hover:bg-[#2a8eef] transition-all duration-300 shadow-lg hover:-translate-y-[2px]">
                                    Get Started - It's Free
                                </button>
                            </Link>
                            <div className="flex items-center space-x-2 text-gray-600">
                                <span className="material-symbols-outlined text-green-500">check_circle</span>
                                <span>No credit card required</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Login/Signup Form */}
                    <div className="member-shimmer bg-white/90 dark:bg-[var(--theme-surface)] rounded-3xl border border-white dark:border-[var(--theme-border)] shadow-[0_24px_60px_-24px_rgba(37,99,235,0.45)] p-8 backdrop-blur-sm admin-fade-up">
                        {/* Tabs */}
                        <div className="flex border-b border-gray-200 dark:border-[var(--theme-border)] mb-6">
                            <button
                                onClick={() => { setActiveTab('login'); setLoginError(null); }}
                                className={`flex-1 py-3 font-medium text-center transition-colors ${
                                    activeTab === 'login'
                                        ? 'text-[#359EFF] border-b-2 border-[#359EFF]'
                                        : 'text-gray-500 dark:text-[var(--text-secondary)] hover:text-gray-700 dark:hover:text-[var(--text-primary)]'
                                }`}
                            >
                                Log In
                            </button>
                            <button
                                onClick={() => { setActiveTab('signup'); setLoginError(null); }}
                                className={`flex-1 py-3 font-medium text-center transition-colors ${
                                    activeTab === 'signup'
                                        ? 'text-[#359EFF] border-b-2 border-[#359EFF]'
                                        : 'text-gray-500 dark:text-[var(--text-secondary)] hover:text-gray-700 dark:hover:text-[var(--text-primary)]'
                                }`}
                            >
                                Sign Up
                            </button>
                        </div>

                        {loginError && (
                            <div role="alert" className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                                {loginError}
                            </div>
                        )}

                        {/* Form */}
                        {activeTab === 'login' ? (
                            <form onSubmit={handleSubmit(onLoginSubmit)} className="space-y-5">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-[var(--text-secondary)] mb-2">
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
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-[var(--theme-border)] rounded-lg bg-white dark:bg-[var(--bg-primary)] text-gray-900 dark:text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#359EFF] focus:border-transparent"
                                        placeholder="name@example.com"
                                    />
                                    {errors.email && (
                                        <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                                    )}
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-[var(--text-secondary)]">
                                            Password
                                        </label>
                                        <Link to="/forgot-password" className="text-sm text-[#359EFF] hover:underline">
                                            Forgot Password?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <input
                                            {...register('password', { required: 'Password is required' })}
                                            type={showPassword ? 'text' : 'password'}
                                            id="password"
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-[var(--theme-border)] rounded-lg bg-white dark:bg-[var(--bg-primary)] text-gray-900 dark:text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#359EFF] focus:border-transparent pr-12"
                                            placeholder="Enter your password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-[var(--text-secondary)] hover:text-gray-700 dark:hover:text-[var(--text-primary)]"
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

                                <button
                                    type="submit"
                                    className="member-shimmer w-full py-3 bg-[#359EFF] text-white rounded-xl font-semibold hover:bg-[#2a8eef] transition-all duration-300 hover:-translate-y-[1px]"
                                    disabled={loginMutation.isPending}
                                >
                                    {loginMutation.isPending ? 'Logging in...' : 'Log In'}
                                </button>
                            </form>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-600 dark:text-[var(--text-secondary)] mb-6">Create your account to get started</p>
                                <Link to="/register">
                                    <button className="member-shimmer w-full py-3 bg-[#359EFF] text-white rounded-xl font-semibold hover:bg-[#2a8eef] transition-all duration-300 hover:-translate-y-[1px]">
                                        Sign Up Now
                                    </button>
                                </Link>
                            </div>
                        )}

                        {/* Divider */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300 dark:border-[var(--theme-border)]"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white dark:bg-[var(--theme-surface)] text-gray-500 dark:text-[var(--text-secondary)] font-medium">OR CONTINUE WITH</span>
                            </div>
                        </div>

                        {/* Social Login Buttons */}
                        <div className="space-y-3">
                            <a
                                href={`${import.meta.env.VITE_API_URL || '/api'}/auth/google`}
                                className="w-full flex items-center justify-center space-x-3 px-4 py-3 border border-gray-300 dark:border-[var(--theme-border)] rounded-lg hover:bg-gray-50 dark:hover:bg-[var(--theme-surface-hover)] transition-colors font-medium text-gray-700 dark:text-[var(--text-primary)] no-underline"
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
                                <span>Google</span>
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="bg-[var(--theme-surface)]/55 py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4">
                            Built for modern collaboration
                        </h2>
                        <p className="text-xl text-[var(--text-secondary)] max-w-3xl mx-auto">
                            Discover how Connectly brings people together with powerful tools designed for simplicity and scale.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Communities Feature */}
                        <div className="member-shimmer bg-[var(--theme-surface)] rounded-2xl border border-[var(--theme-border)] p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                            <div className="w-12 h-12 bg-[#359EFF]/10 rounded-lg flex items-center justify-center mb-6">
                                <span className="material-symbols-outlined text-[#359EFF] text-3xl">groups</span>
                            </div>
                            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3">Communities</h3>
                            <p className="text-[var(--text-secondary)] leading-relaxed">
                                Find your niche and grow together. Create or join vibrant spaces tailored to your specific interests.
                            </p>
                        </div>

                        {/* Real-time Chat Feature */}
                        <div className="member-shimmer bg-[var(--theme-surface)] rounded-2xl border border-[var(--theme-border)] p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                            <div className="w-12 h-12 bg-[#359EFF]/10 rounded-lg flex items-center justify-center mb-6">
                                <span className="material-symbols-outlined text-[#359EFF] text-3xl">chat_bubble</span>
                            </div>
                            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3">Real-time Chat</h3>
                            <p className="text-[var(--text-secondary)] leading-relaxed">
                                Instant messaging with zero lag. Connect instantly with members across the globe with low latency.
                            </p>
                        </div>

                        {/* Privacy Feature */}
                        <div className="member-shimmer bg-[var(--theme-surface)] rounded-2xl border border-[var(--theme-border)] p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                            <div className="w-12 h-12 bg-[#359EFF]/10 rounded-lg flex items-center justify-center mb-6">
                                <span className="material-symbols-outlined text-[#359EFF] text-3xl">shield</span>
                            </div>
                            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3">Privacy</h3>
                            <p className="text-[var(--text-secondary)] leading-relaxed">
                                Your data belongs to you, always encrypted. We prioritize your digital safety with end-to-end security.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Ready to Join Section */}
            <section className="py-20 bg-[var(--bg-primary)]/35">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Left Side - Image */}
                        <div className="relative">
                            <div className="bg-gradient-to-br from-teal-100 to-green-100 dark:from-teal-500/25 dark:to-emerald-500/20 rounded-2xl p-12 aspect-square flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-32 h-32 bg-white/95 dark:bg-[var(--theme-surface)] rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                                        <span className="material-symbols-outlined text-6xl text-[#359EFF]">person</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 mt-8">
                                        {[1, 2, 3, 4, 5, 6].map((i) => (
                                            <div key={i} className="w-12 h-12 bg-white/95 dark:bg-[var(--theme-surface)] rounded-full flex items-center justify-center shadow-md">
                                                <span className="text-xs text-gray-600 dark:text-[var(--text-secondary)]">U{i}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side - Benefits */}
                        <div>
                            <h2 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-6">
                                Ready to join the conversation?
                            </h2>
                            <p className="text-xl text-[var(--text-secondary)] mb-8 leading-relaxed">
                                Connectly is more than just a chat app. It's where ideas take root and friendships are built. Join our ever-growing network today.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-center space-x-3">
                                    <span className="material-symbols-outlined text-green-500 text-2xl">check_circle</span>
                                    <span className="text-lg text-[var(--text-primary)]">256-bit AES encryption</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <span className="material-symbols-outlined text-green-500 text-2xl">check_circle</span>
                                    <span className="text-lg text-[var(--text-primary)]">Unlimited community members</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <span className="material-symbols-outlined text-green-500 text-2xl">check_circle</span>
                                    <span className="text-lg text-[var(--text-primary)]">Mobile and desktop apps</span>
                                </div>
                            </div>
                            <div className="mt-8">
                                <Link to="/register">
                                    <button className="member-shimmer px-8 py-3 bg-[#359EFF] text-white rounded-xl font-semibold hover:bg-[#2a8eef] transition-all duration-300 shadow-lg hover:-translate-y-[1px]">
                                        Get Started Free
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[var(--theme-surface)] border-t border-[var(--theme-border)] py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between">
                        {/* Left - Logo & Copyright */}
                        <div className="flex items-center space-x-2 mb-4 md:mb-0">
                            <div className="w-6 h-6 bg-[#359EFF] rounded flex items-center justify-center">
                                <span className="text-white font-bold text-sm">C</span>
                            </div>
                            <span className="text-[var(--text-primary)] font-semibold">Connectly</span>
                            <span className="text-[var(--text-secondary)]">© 2024</span>
                        </div>

                        {/* Center - Links */}
                        <nav className="flex items-center space-x-6 mb-4 md:mb-0">
                            <Link to="/privacy" className="text-[var(--text-secondary)] hover:text-[#359EFF] transition-colors text-sm">
                                Privacy Policy
                            </Link>
                            <Link to="/terms" className="text-[var(--text-secondary)] hover:text-[#359EFF] transition-colors text-sm">
                                Terms of Service
                            </Link>
                            <Link to="/contact" className="text-[var(--text-secondary)] hover:text-[#359EFF] transition-colors text-sm">
                                Contact Us
                            </Link>
                        </nav>

                        {/* Right - Icons */}
                        <div className="flex items-center space-x-4">
                            <button className="text-[var(--text-secondary)] hover:text-[#359EFF] transition-colors">
                                <span className="material-symbols-outlined">language</span>
                            </button>
                            <button className="text-[var(--text-secondary)] hover:text-[#359EFF] transition-colors">
                                <span className="material-symbols-outlined">chat_bubble</span>
                            </button>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
