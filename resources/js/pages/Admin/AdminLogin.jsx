import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { useLogin, useTwoFactorChallenge, useLogout } from '../../hooks/useAuth';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

/**
 * Dedicated admin portal sign-in (same API as /login; only users with role admin can proceed).
 */
const AdminLogin = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const loginMutation = useLogin();
    const twoFactorMutation = useTwoFactorChallenge();
    const logoutMutation = useLogout();
    const [showPassword, setShowPassword] = useState(false);
    const [showTwoFactor, setShowTwoFactor] = useState(false);
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [apiError, setApiError] = useState(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        defaultValues: { email: '', password: '' },
    });

    const ensureAdminOrRevert = () => {
        const user = useAuthStore.getState().user;
        if (user?.role !== 'admin') {
            useAuthStore.getState().logout();
            queryClient.clear();
            setApiError('This account is not authorized for the admin portal. Use a user with the admin role.');
            toast.error('Not an admin account');
            return false;
        }
        return true;
    };

    const onSubmit = async (data) => {
        setApiError(null);
        try {
            const res = await loginMutation.mutateAsync(data);
            if (res.data?.requires_two_factor) {
                setShowTwoFactor(true);
                return;
            }
            if (!ensureAdminOrRevert()) return;
            navigate('/admin', { replace: true });
        } catch (error) {
            const res = error?.response?.data;
            const errs = res?.errors;
            const msg =
                errs?.email?.[0] ??
                errs?.password?.[0] ??
                res?.message ??
                'Invalid email/username or password.';
            setApiError(msg);
            toast.error(msg);
        }
    };

    const onTwoFactorSubmit = async (e) => {
        e.preventDefault();
        try {
            await twoFactorMutation.mutateAsync(twoFactorCode);
            if (!ensureAdminOrRevert()) return;
            navigate('/admin', { replace: true });
        } catch (error) {
            const msg = error?.response?.data?.message || error?.message || 'Verification failed.';
            toast.error(msg);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f4f6fb] px-4 py-10">
            <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col lg:flex-row min-h-[560px]">
                {/* Left — brand / pitch */}
                <div className="lg:w-1/2 bg-gradient-to-br from-indigo-50 via-violet-50 to-blue-50 p-10 lg:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-100">
                    <div>
                        <div className="flex items-center gap-2 mb-10">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md">
                                <span className="material-symbols-outlined text-white text-2xl">auto_awesome</span>
                            </div>
                            <span className="text-xl font-bold text-slate-900 tracking-tight">Connectly</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight max-w-md">
                            Manage your social{' '}
                            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                                ecosystem
                            </span>{' '}
                            with absolute precision.
                        </h1>
                        <p className="mt-4 text-slate-600 text-sm leading-relaxed max-w-md">
                            Access the high-performance admin portal to orchestrate campaigns, analyze audience metrics,
                            and scale your brand identity.
                        </p>
                    </div>
                    <div className="mt-8 lg:mt-0">
                        <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur rounded-2xl px-4 py-3 border border-white shadow-sm">
                            <div className="flex -space-x-2">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-200 to-orange-300 border-2 border-white" />
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-200 to-teal-300 border-2 border-white" />
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-200 to-purple-300 border-2 border-white" />
                            </div>
                            <p className="text-xs text-slate-600 font-medium">Join 12,000+ curators worldwide.</p>
                        </div>
                    </div>
                </div>

                {/* Right — form */}
                <div className="lg:w-1/2 p-10 lg:p-12 flex flex-col justify-center bg-white">
                    {showTwoFactor ? (
                        <form onSubmit={onTwoFactorSubmit} className="w-full max-w-md mx-auto">
                            <h2 className="text-xl font-bold text-slate-900">Two-factor authentication</h2>
                            <p className="text-sm text-slate-500 mt-2">Enter the code from your authenticator app.</p>
                            <input
                                type="text"
                                value={twoFactorCode}
                                onChange={(e) => setTwoFactorCode(e.target.value)}
                                className="mt-6 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                placeholder="000000"
                                autoComplete="one-time-code"
                            />
                            <button
                                type="submit"
                                disabled={twoFactorMutation.isPending}
                                className="mt-4 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold py-3.5 hover:opacity-95 disabled:opacity-60"
                            >
                                {twoFactorMutation.isPending ? 'Verifying…' : 'Verify & continue'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    logoutMutation.mutate();
                                    setShowTwoFactor(false);
                                    setTwoFactorCode('');
                                }}
                                className="mt-3 w-full text-sm text-slate-500 hover:text-slate-800"
                            >
                                Cancel
                            </button>
                        </form>
                    ) : (
                        <div className="w-full max-w-md mx-auto">
                            <h2 className="text-2xl font-bold text-slate-900">Welcome Back, Admin</h2>
                            <p className="text-sm text-slate-500 mt-2">
                                Please enter your credentials to access the portal.
                            </p>

                            {apiError && (
                                <div
                                    role="alert"
                                    className="mt-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm"
                                >
                                    {apiError}
                                </div>
                            )}

                            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                                        Email or username
                                    </label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                                            mail
                                        </span>
                                        <input
                                            type="text"
                                            autoComplete="username"
                                            placeholder="admin@connectly.app"
                                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                            {...register('email', { required: 'Required' })}
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                                    )}
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                                            Password
                                        </label>
                                        <Link
                                            to="/forgot-password"
                                            className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                                            lock
                                        </span>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            autoComplete="current-password"
                                            className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                            {...register('password', { required: 'Required' })}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((s) => !s)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            <span className="material-symbols-outlined text-xl">
                                                {showPassword ? 'visibility_off' : 'visibility'}
                                            </span>
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                                    )}
                                </div>

                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-slate-600">Stay logged in for 30 days</span>
                                </label>

                                <button
                                    type="submit"
                                    disabled={loginMutation.isPending}
                                    className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold py-3.5 shadow-lg shadow-indigo-500/25 hover:opacity-95 disabled:opacity-60 flex items-center justify-center gap-2"
                                >
                                    {loginMutation.isPending ? 'Signing in…' : 'Sign In to Dashboard'}
                                    {!loginMutation.isPending && (
                                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                    )}
                                </button>
                            </form>

                            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                                <span className="inline-flex items-center gap-1">
                                    <span className="material-symbols-outlined text-base text-slate-400">shield</span>
                                    SECURE 256-BIT AES
                                </span>
                                <span className="space-x-3">
                                    <a href="#" className="hover:text-slate-800">
                                        Terms
                                    </a>
                                    <a href="#" className="hover:text-slate-800">
                                        Privacy
                                    </a>
                                    <a href="#" className="hover:text-slate-800">
                                        Support
                                    </a>
                                </span>
                            </div>

                            <p className="mt-8 text-center text-sm text-slate-500">
                                Member login?{' '}
                                <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
                                    Go to app sign in
                                </Link>
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <p className="fixed bottom-4 left-0 right-0 text-center text-[10px] uppercase tracking-widest text-slate-400">
                © {new Date().getFullYear()} Connectly Social Technologies Inc.
            </p>
        </div>
    );
};

export default AdminLogin;
