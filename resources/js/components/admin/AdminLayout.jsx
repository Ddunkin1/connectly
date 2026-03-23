import React, { useEffect } from 'react';
import { NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import { useLogout } from '../../hooks/useAuth';
import AdminThemeToggle from './AdminThemeToggle';

const navClass = ({ isActive }) =>
    `group admin-nav-wiggle relative isolate flex items-center gap-3 min-w-0 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-300 ${
        isActive
            ? 'bg-gradient-to-r from-[var(--theme-accent)] to-indigo-500 text-white shadow-[0_12px_30px_-12px_color-mix(in_srgb,var(--theme-accent)_70%,#000)]'
            : 'text-[var(--text-secondary)] hover:bg-[var(--theme-surface-hover)]/80 hover:text-[var(--text-primary)] hover:-translate-y-[1px]'
    }`;

/**
 * Standalone admin shell (no MainLayout / member top bar or sidebars).
 */
const AdminLayout = () => {
    const user = useAuthStore((state) => state.user);
    const navigate = useNavigate();
    const logoutMutation = useLogout();
    const applyTheme = useThemeStore((s) => s.applyToDom);

    useEffect(() => {
        applyTheme();
    }, [applyTheme]);

    if (!user?.role || user.role !== 'admin') {
        return <Navigate to="/home" replace />;
    }

    const handleSignOut = () => {
        logoutMutation.mutate(undefined, {
            onSettled: () => navigate('/admin/login', { replace: true }),
        });
    };

    return (
        <div className="h-[100dvh] min-h-0 overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col w-full">
            <header className="h-16 shrink-0 z-30 flex items-center justify-between gap-4 border-b border-[var(--theme-border)] bg-[var(--theme-surface)]/85 px-4 backdrop-blur-xl lg:px-8">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#359EFF] shadow-md transition-transform duration-300 hover:scale-[1.03]">
                        <span className="text-white font-bold text-xl leading-none">C</span>
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-secondary)] leading-tight">
                            Admin
                        </p>
                        <p className="text-base font-bold tracking-tight text-[var(--text-primary)] truncate">
                            Connectly
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <AdminThemeToggle />
                    <span className="hidden sm:inline text-sm text-[var(--text-secondary)] truncate max-w-[140px] md:max-w-[220px]">
                        {user.name}
                    </span>
                    <button
                        type="button"
                        onClick={handleSignOut}
                        disabled={logoutMutation.isPending}
                        className="admin-shimmer text-sm font-medium px-4 py-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-hover)]/60 text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] hover:border-[var(--theme-accent)]/50 transition-all duration-300 disabled:opacity-60"
                    >
                        {logoutMutation.isPending ? 'Signing out…' : 'Sign out'}
                    </button>
                </div>
            </header>

            <div className="flex flex-1 min-h-0 w-full overflow-hidden">
                <aside className="w-64 shrink-0 border-r border-[var(--theme-border)] bg-[var(--theme-surface)]/95 flex flex-col py-5 px-3 overflow-y-auto min-h-0 backdrop-blur-sm">
                    <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                        Navigate
                    </p>
                    <nav className="flex flex-col gap-1 flex-1">
                        <NavLink to="/admin" className={navClass} end>
                            <span className="material-symbols-outlined text-[22px] opacity-90 transition-transform duration-300 group-hover:scale-105">dashboard</span>
                            <span>Dashboard</span>
                        </NavLink>
                        <NavLink to="/admin/users" className={navClass} end={false}>
                            <span className="material-symbols-outlined text-[22px] opacity-90 transition-transform duration-300 group-hover:scale-105">group</span>
                            <span>Users</span>
                        </NavLink>
                        <NavLink to="/admin/reports" className={navClass}>
                            <span className="material-symbols-outlined text-[22px] opacity-90 transition-transform duration-300 group-hover:scale-105">flag</span>
                            <span>Reports</span>
                        </NavLink>
                        <NavLink to="/admin/warning-appeals" className={navClass}>
                            <span className="material-symbols-outlined text-[22px] opacity-90 transition-transform duration-300 group-hover:scale-105">campaign</span>
                            <span>Warning appeals</span>
                        </NavLink>
                        <NavLink to="/admin/ban-appeals" className={navClass}>
                            <span className="material-symbols-outlined text-[22px] opacity-90 transition-transform duration-300 group-hover:scale-105">gavel</span>
                            <span>Ban appeals</span>
                        </NavLink>
                        <NavLink to="/admin/settings" className={navClass}>
                            <span className="material-symbols-outlined text-[22px] opacity-90 transition-transform duration-300 group-hover:scale-105">settings</span>
                            <span>Settings</span>
                        </NavLink>
                    </nav>
                </aside>

                <div className="relative flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden admin-main-canvas">
                    {/* Decorative wash — vibrant ambient */}
                    <div
                        className="pointer-events-none absolute inset-0 overflow-hidden"
                        aria-hidden
                    >
                        <div className="admin-blob-motion absolute -top-28 right-8 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-[110px]" />
                        <div className="admin-blob-motion-slow absolute top-1/3 left-8 h-64 w-64 rounded-full bg-violet-500/16 blur-[95px]" />
                        <div className="admin-blob-motion-fast absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-indigo-500/16 blur-[90px]" />
                    </div>
                    <main className="relative z-[1] flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-5 py-6 sm:px-8 sm:py-8">
                        <div className="max-w-6xl mx-auto admin-fade-up">
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
