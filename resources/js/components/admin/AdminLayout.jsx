import React, { useEffect } from 'react';
import { NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import { useLogout } from '../../hooks/useAuth';
import AdminThemeToggle from './AdminThemeToggle';

const navClass = ({ isActive }) =>
    `group flex items-center gap-3 min-w-0 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
        isActive
            ? 'bg-[var(--theme-accent)] text-white shadow-md shadow-[var(--theme-accent)]/30'
            : 'text-[var(--text-secondary)] hover:bg-[var(--theme-surface-hover)] hover:text-[var(--text-primary)]'
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
            <header className="h-14 shrink-0 z-30 flex items-center justify-between gap-4 border-b border-[var(--theme-border)] bg-[var(--theme-surface)]/90 px-4 backdrop-blur-md lg:px-8">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 shadow-lg shadow-violet-900/40 ring-1 ring-white/10">
                        <span className="material-symbols-outlined text-white text-[22px]">shield_person</span>
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
                        className="text-sm font-medium px-4 py-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-hover)]/50 text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] hover:border-[var(--theme-accent)]/40 transition-colors disabled:opacity-60"
                    >
                        {logoutMutation.isPending ? 'Signing out…' : 'Sign out'}
                    </button>
                </div>
            </header>

            <div className="flex flex-1 min-h-0 w-full overflow-hidden">
                <aside className="w-60 shrink-0 border-r border-[var(--theme-border)] bg-[var(--theme-surface)] flex flex-col py-5 px-3 overflow-y-auto min-h-0">
                    <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                        Navigate
                    </p>
                    <nav className="flex flex-col gap-0.5 flex-1">
                        <NavLink to="/admin" className={navClass} end>
                            <span className="material-symbols-outlined text-[22px] opacity-90">dashboard</span>
                            <span>Dashboard</span>
                        </NavLink>
                        <NavLink to="/admin/users" className={navClass} end={false}>
                            <span className="material-symbols-outlined text-[22px] opacity-90">group</span>
                            <span>Users</span>
                        </NavLink>
                        <NavLink to="/admin/reports" className={navClass}>
                            <span className="material-symbols-outlined text-[22px] opacity-90">flag</span>
                            <span>Reports</span>
                        </NavLink>
                        <NavLink to="/admin/warning-appeals" className={navClass}>
                            <span className="material-symbols-outlined text-[22px] opacity-90">campaign</span>
                            <span>Warning appeals</span>
                        </NavLink>
                        <NavLink to="/admin/settings" className={navClass}>
                            <span className="material-symbols-outlined text-[22px] opacity-90">settings</span>
                            <span>Settings</span>
                        </NavLink>
                    </nav>
                </aside>

                <div className="relative flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
                    {/* Decorative wash — subtle purple ambient */}
                    <div
                        className="pointer-events-none absolute inset-0 overflow-hidden"
                        aria-hidden
                    >
                        <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-[var(--theme-accent)]/[0.07] blur-[100px]" />
                        <div className="absolute bottom-0 left-1/4 h-48 w-48 rounded-full bg-indigo-500/[0.05] blur-[80px]" />
                    </div>
                    <main className="relative z-[1] flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-5 py-6 sm:px-8 sm:py-8">
                        <div className="max-w-6xl mx-auto">
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
