import React from 'react';
import { NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { useLogout } from '../../hooks/useAuth';

const navClass = ({ isActive }) =>
    `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
        isActive
            ? 'bg-[var(--theme-accent)] text-white'
            : 'text-[var(--text-secondary)] hover:bg-[var(--theme-surface-hover)] hover:text-[var(--text-primary)]'
    }`;

/**
 * Standalone admin shell (no MainLayout / member top bar or sidebars).
 */
const AdminLayout = () => {
    const user = useAuthStore((state) => state.user);
    const navigate = useNavigate();
    const logoutMutation = useLogout();

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
            {/* Admin-only top bar — not the member AppTopBar */}
            <header className="h-14 shrink-0 border-b border-[var(--theme-border)] bg-[var(--theme-surface)] flex items-center justify-between px-4 lg:px-8 gap-4 z-20">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shrink-0">
                        <span className="material-symbols-outlined text-white text-xl">shield_person</span>
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider leading-tight">
                            Admin portal
                        </p>
                        <p className="text-base font-bold text-[var(--text-primary)] truncate">Connectly</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                    <span className="text-sm text-[var(--text-secondary)] truncate max-w-[140px] sm:max-w-[220px] hidden sm:inline">
                        {user.name}
                    </span>
                    <button
                        type="button"
                        onClick={handleSignOut}
                        disabled={logoutMutation.isPending}
                        className="text-sm font-medium px-3 py-2 rounded-lg border border-[var(--theme-border)] text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] disabled:opacity-60"
                    >
                        {logoutMutation.isPending ? 'Signing out…' : 'Sign out'}
                    </button>
                </div>
            </header>

            <div className="flex flex-1 min-h-0 w-full overflow-hidden">
                <aside className="w-56 shrink-0 border-r border-[var(--theme-border)] bg-[var(--theme-surface)] flex flex-col py-6 px-3 overflow-y-auto min-h-0">
                    <nav className="flex flex-col gap-1 flex-1">
                        <NavLink to="/admin" className={navClass} end>
                            <span className="material-symbols-outlined text-xl">dashboard</span>
                            Dashboard
                        </NavLink>
                        <NavLink to="/admin/users" className={navClass} end={false}>
                            <span className="material-symbols-outlined text-xl">group</span>
                            Users
                        </NavLink>
                        <NavLink to="/admin/reports" className={navClass}>
                            <span className="material-symbols-outlined text-xl">flag</span>
                            Reports
                        </NavLink>
                        <NavLink to="/admin/settings" className={navClass}>
                            <span className="material-symbols-outlined text-xl">settings</span>
                            Settings
                        </NavLink>
                    </nav>
                </aside>

                <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
                    <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-6 lg:p-8">
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
