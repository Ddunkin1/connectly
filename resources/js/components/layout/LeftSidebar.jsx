import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { useLogout } from '../../hooks/useAuth';
import Avatar from '../common/Avatar';
import { useUnreadNotificationsCount } from '../../hooks/useNotifications';
import { useConversations } from '../../hooks/useConversations';

const LeftSidebar = ({ className = '', onNavigate, positionBelowNav = false }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const { data: unreadNotifications } = useUnreadNotificationsCount();
    const { data: conversationsData } = useConversations();

    const notificationsBadge = unreadNotifications ?? 0;
    const messagesBadge = conversationsData?.pages
        ?.flatMap((p) => p.data?.conversations ?? [])
        ?.reduce((sum, c) => sum + (c.unread_count ?? 0), 0) ?? 0;

    const navItems = [
        { icon: 'home', label: 'Home', path: '/home' },
        { icon: 'explore', label: 'Explore', path: '/explore' },
        { icon: 'notifications', label: 'Notifications', path: '/notifications', badge: notificationsBadge },
        { icon: 'mail', label: 'Messages', path: '/messages', badge: messagesBadge },
        { icon: 'group', label: 'Connections', path: '/connections' },
        { icon: 'groups', label: 'Communities', path: '/communities' },
        { icon: 'bookmark', label: 'Bookmarks', path: '/bookmarks' },
        { icon: 'monitoring', label: 'Analytics', path: '/analytics' },
    ];

    const logoutMutation = useLogout();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const userMenuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleLogout = () => {
        setShowUserMenu(false);
        logoutMutation.mutate(undefined, {
            onSettled: () => navigate('/login', { replace: true }),
        });
    };

    const wrapperClass = `w-[240px] flex flex-col px-4 pt-6 pb-4 bg-[var(--theme-bg-sidebar)] z-30 overflow-y-auto h-full border-r border-white/5
        ${className}`.trim();

    const handleNavClick = () => { onNavigate?.(); };

    return (
        <aside className={wrapperClass}>
            {user && (
                <div className="mb-8 px-1 relative" ref={userMenuRef}>
                    <button
                        type="button"
                        onClick={() => setShowUserMenu((v) => !v)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-[var(--theme-surface)] hover:bg-[var(--theme-surface-hover)] transition-colors cursor-pointer text-left shadow-sm border border-white/5"
                    >
                        <Avatar src={user.profile_picture} alt={user.name} size="md" className="w-10 h-10 rounded-full shrink-0" />
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-semibold text-[var(--text-primary)] truncate">{user.name}</span>
                            <span className="text-xs text-slate-500 truncate">@{user.username}</span>
                        </div>
                        <span className="material-symbols-outlined text-slate-400 ml-auto text-lg">expand_more</span>
                    </button>
                    {showUserMenu && (
                        <div className="absolute left-2 right-2 mt-2 py-1 rounded-2xl theme-surface border border-[var(--theme-border)] shadow-xl z-50">
                            <Link
                                to={`/profile/${user.username}`}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)]"
                                onClick={() => { setShowUserMenu(false); handleNavClick(); }}
                            >
                                <span className="material-symbols-outlined text-lg">person</span>
                                Profile
                            </Link>
                            <Link
                                to="/settings"
                                className="flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)]"
                                onClick={() => { setShowUserMenu(false); handleNavClick(); }}
                            >
                                <span className="material-symbols-outlined text-lg">settings</span>
                                Settings
                            </Link>
                            <button
                                type="button"
                                onClick={handleLogout}
                                disabled={logoutMutation.isPending}
                                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 text-left"
                            >
                                <span className="material-symbols-outlined text-lg">logout</span>
                                {logoutMutation.isPending ? 'Logging out...' : 'Log out'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            <nav className="flex-1 space-y-1 mb-4" aria-label="Main navigation">
                {navItems.map((item) => {
                    const isActive =
                        item.path === location.pathname ||
                        (item.path === '/search' && location.pathname === '/search') ||
                        (item.path === '/home' && location.pathname === '/home');
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={handleNavClick}
                            className={`group flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-colors relative ${
                                isActive
                                    ? 'bg-primary/10 text-primary shadow-[0_10px_30px_rgba(37,99,235,0.25)]'
                                    : 'text-slate-500 hover:text-[var(--text-primary)] hover:bg-white/10'
                            }`}
                        >
                            <span
                                className={`material-symbols-outlined text-[22px] ${
                                    isActive ? 'text-primary' : 'text-slate-400 group-hover:text-[var(--text-primary)]'
                                }`}
                            >
                                {item.icon}
                            </span>
                            <span className="text-sm font-medium">{item.label}</span>
                            {item.badge > 0 && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-red-500 text-[10px] flex items-center justify-center text-white rounded-full" aria-label={`${item.badge} unread`}>
                                    {item.badge > 99 ? '99+' : item.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-2">
                <button
                    type="button"
                    onClick={() => { navigate('/settings'); handleNavClick(); }}
                    className="w-full h-11 min-h-11 px-4 rounded-2xl font-medium text-sm flex items-center justify-between bg-[var(--theme-surface)] hover:bg-[var(--theme-surface-hover)] text-[var(--text-primary)] transition-colors cursor-pointer border border-[var(--theme-border)]/60"
                >
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[20px] text-[var(--text-primary)]/80">settings</span>
                        <span>Settings</span>
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-[var(--text-primary)]/50">chevron_right</span>
                </button>
            </div>
        </aside>
    );
};

export default LeftSidebar;
