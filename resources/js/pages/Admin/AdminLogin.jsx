import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { useLogin, useTwoFactorChallenge, useLogout } from '../../hooks/useAuth';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import AdminThemeToggle from '../../components/admin/AdminThemeToggle';
import toast from 'react-hot-toast';

const inputClass =
    'w-full rounded-xl border border-[var(--theme-border)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:ring-2 focus:ring-[var(--theme-accent)]/50 focus:border-[var(--theme-accent)] outline-none';

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isValidUsername = (value) => /^[a-zA-Z0-9_.-]{3,32}$/.test(value);

const getIdentifierState = (value) => {
    const v = value.trim();
    if (!v) return { valid: false, helper: 'Use admin email or username' };
    const valid = v.includes('@') ? isValidEmail(v) : isValidUsername(v);
    return {
        valid,
        helper: valid
            ? v.includes('@')
                ? 'Email format looks good'
                : 'Username format looks good'
            : 'Enter a valid email or username',
    };
};

const getPasswordState = (value) => {
    const len = value.length;
    if (!len) return { valid: false, helper: 'Password is required' };
    if (len < 8) return { valid: false, helper: 'Use at least 8 characters' };
    return { valid: true, helper: 'Password length looks good' };
};

/**
 * Dedicated admin portal sign-in (same API as /login; only users with role admin can proceed).
 * Respects global light/dim theme (CSS variables).
 */
const AdminLogin = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const loginMutation = useLogin();
    const twoFactorMutation = useTwoFactorChallenge();
    const logoutMutation = useLogout();
    const applyTheme = useThemeStore((s) => s.applyToDom);

    const [showPassword, setShowPassword] = useState(false);
    const [showTwoFactor, setShowTwoFactor] = useState(false);
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [apiError, setApiError] = useState(null);
    const [capsLockOn, setCapsLockOn] = useState(false);

    useEffect(() => {
        applyTheme();
    }, [applyTheme]);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm({
        mode: 'onChange',
        defaultValues: { email: '', password: '' },
    });
    const identifier = watch('email') ?? '';
    const password = watch('password') ?? '';
    const identifierState = getIdentifierState(identifier);
    const passwordState = getPasswordState(password);
    const canSubmit = identifierState.valid && passwordState.valid && !loginMutation.isPending;

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
        <div className="admin-login-canvas relative min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4 py-10 text-[var(--text-primary)] overflow-hidden">
            <div className="admin-login-orb pointer-events-none absolute -top-24 -left-20 h-72 w-72 rounded-full bg-fuchsia-500/25 blur-[95px]" />
            <div className="admin-login-orb-slow pointer-events-none absolute top-1/3 -right-16 h-72 w-72 rounded-full bg-indigo-500/25 blur-[95px]" />
            <div className="admin-login-orb-fast pointer-events-none absolute -bottom-28 left-1/3 h-80 w-80 rounded-full bg-violet-500/20 blur-[110px]" />
            <div className="fixed top-4 right-4 z-50">
                <AdminThemeToggle />
            </div>

            <div className="admin-login-card admin-shimmer relative z-10 w-full max-w-md rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-surface)]/95 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.75)] overflow-hidden min-h-[560px]">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                <div className="p-8 sm:p-10 flex flex-col justify-center h-full">
                    {showTwoFactor ? (
                        <form onSubmit={onTwoFactorSubmit} className="w-full">
                            <h2 className="text-xl font-bold text-[var(--text-primary)]">Two-factor authentication</h2>
                            <p className="text-sm text-[var(--text-secondary)] mt-2">
                                Enter the code from your authenticator app.
                            </p>
                            <input
                                type="text"
                                value={twoFactorCode}
                                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className={`mt-6 pl-4 pr-4 py-3 ${inputClass}`}
                                placeholder="000000"
                                autoComplete="one-time-code"
                                maxLength={6}
                            />
                            <button
                                type="submit"
                                disabled={twoFactorMutation.isPending || twoFactorCode.length !== 6}
                                className="admin-login-cta mt-4 w-full rounded-xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600 text-white font-semibold py-3.5 hover:opacity-95 disabled:opacity-60 transition-all duration-300 hover:-translate-y-[1px]"
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
                                className="mt-3 w-full text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            >
                                Cancel
                            </button>
                        </form>
                    ) : (
                        <div className="w-full">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="admin-login-logo-pulse flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#359EFF] to-indigo-600">
                                    <span className="text-white font-bold text-lg leading-none">C</span>
                                </div>
                                <span className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                                    Admin Portal
                                </span>
                            </div>
                            <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">Admin sign in</h2>
                            <p className="text-sm text-[var(--text-secondary)] mt-2">
                                Real-time validation is enabled. Enter your admin credentials to continue.
                            </p>

                            {apiError && (
                                <div
                                    role="alert"
                                    className="mt-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 text-sm"
                                >
                                    {apiError}
                                </div>
                            )}

                            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
                                <div>
                                    <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">
                                        Email or username
                                    </label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-xl">
                                            mail
                                        </span>
                                        <input
                                            type="text"
                                            autoComplete="username"
                                            placeholder="admin@connectly.app"
                                            className={`pl-11 pr-4 py-3 ${inputClass}`}
                                            {...register('email', { required: 'Required' })}
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                                    )}
                                    {!errors.email && (
                                        <p
                                            className={`text-xs mt-1 ${
                                                identifierState.valid ? 'text-emerald-500' : 'text-[var(--text-secondary)]'
                                            }`}
                                        >
                                            {identifierState.helper}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                                            Password
                                        </label>
                                        <Link
                                            to="/forgot-password"
                                            className="text-xs font-medium text-[var(--theme-accent)] hover:opacity-90"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-xl">
                                            lock
                                        </span>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            autoComplete="current-password"
                                            className={`pl-11 pr-12 py-3 ${inputClass}`}
                                            {...register('password', { required: 'Required' })}
                                            onKeyUp={(e) => setCapsLockOn(e.getModifierState('CapsLock'))}
                                            onKeyDown={(e) => setCapsLockOn(e.getModifierState('CapsLock'))}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((s) => !s)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
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
                                    {!errors.password && (
                                        <p
                                            className={`text-xs mt-1 ${
                                                passwordState.valid ? 'text-emerald-500' : 'text-[var(--text-secondary)]'
                                            }`}
                                        >
                                            {passwordState.helper}
                                        </p>
                                    )}
                                    {capsLockOn && (
                                        <p className="text-amber-500 text-xs mt-1">Caps Lock is on</p>
                                    )}
                                </div>

                                <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--bg-primary)]/50 px-3 py-2">
                                    <p className="text-xs text-[var(--text-secondary)]">
                                        Status:{' '}
                                        <span className={identifierState.valid ? 'text-emerald-500' : 'text-[var(--text-secondary)]'}>
                                            ID
                                        </span>{' '}
                                        ·{' '}
                                        <span className={passwordState.valid ? 'text-emerald-500' : 'text-[var(--text-secondary)]'}>
                                            Password
                                        </span>
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!canSubmit}
                                    className="admin-login-cta w-full rounded-xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600 text-white font-semibold py-3.5 shadow-lg shadow-violet-500/30 hover:opacity-95 disabled:opacity-60 flex items-center justify-center gap-2 transition-all duration-300 hover:-translate-y-[1px]"
                                >
                                    {loginMutation.isPending ? 'Signing in…' : 'Sign In to Dashboard'}
                                    {!loginMutation.isPending && (
                                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                    )}
                                </button>
                            </form>

                            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--text-secondary)]">
                                <span className="inline-flex items-center gap-1">
                                    <span className="material-symbols-outlined text-base">shield</span>
                                    SECURE 256-BIT AES
                                </span>
                                <span className="space-x-3">
                                    <a href="#" className="hover:text-[var(--text-primary)]">
                                        Terms
                                    </a>
                                    <a href="#" className="hover:text-[var(--text-primary)]">
                                        Privacy
                                    </a>
                                    <a href="#" className="hover:text-[var(--text-primary)]">
                                        Support
                                    </a>
                                </span>
                            </div>

                            <p className="mt-8 text-center text-sm text-[var(--text-secondary)]">
                                Member login?{' '}
                                <Link to="/login" className="font-medium text-[var(--theme-accent)] hover:opacity-90">
                                    Go to app sign in
                                </Link>
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <p className="fixed bottom-4 left-0 right-0 text-center text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">
                © {new Date().getFullYear()} Connectly Social Technologies Inc.
            </p>
        </div>
    );
};

export default AdminLogin;
