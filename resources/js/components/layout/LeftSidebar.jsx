import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
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
        { icon: 'explore', label: 'Explore', path: '/search' },
        { icon: 'notifications', label: 'Notifications', path: '/notifications', badge: notificationsBadge },
        { icon: 'mail', label: 'Messages', path: '/messages', badge: messagesBadge },
        { icon: 'bookmark', label: 'Bookmarks', path: '/bookmarks' },
        { icon: 'monitoring', label: 'Analytics', path: '/analytics' },
        { icon: 'palette', label: 'Theme', path: null, isTheme: true },
        { icon: 'settings', label: 'Settings', path: '/settings' },
        ...(user?.role === 'admin' ? [{ icon: 'shield', label: 'Admin', path: '/admin/reports' }] : []),
    ];

    const openThemeCustomizer = useThemeStore((s) => s.openCustomizer);
    const isThemeCustomizerOpen = useThemeStore((s) => s.isCustomizerOpen);

    const handleCreatePost = () => {
        navigate('/home');
        setTimeout(() => window.dispatchEvent(new CustomEvent('open-create-post')), 100);
    };

    const wrapperClass = `w-[250px] fixed left-10 border-r border-white/5 flex flex-col p-4 bg-[#121214] z-30 overflow-y-auto
        ${positionBelowNav ? 'top-[60px] h-[calc(100vh-60px)]' : 'top-0 h-screen'}
        ${className}`.trim();

    const handleNavClick = () => { onNavigate?.(); };

    return (
        <aside className={wrapperClass}>
            <div className="flex items-center space-x-2 px-2">
                <Link to="/home" className="flex items-center space-x-2" onClick={handleNavClick}>
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-xl">hub</span>
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">connectly</span>
                </Link>
            </div>

            {user && (
                <Link
                    to={`/profile/${user.username}`}
                    className="mb-8 px-2 flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={handleNavClick}
                >
                    <Avatar src={user.profile_picture} alt={user.name} size="md" className="w-10 h-10 rounded-full shrink-0" />
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-bold text-white truncate">{user.name}</span>
                        <span className="text-xs text-slate-500 truncate">@{user.username}</span>
                    </div>
                </Link>
            )}

            <nav className="flex-1 space-y-1.5 mb-4" aria-label="Main navigation">
                {navItems.map((item) => {
                    if (item.isTheme) {
                        return (
                            <button
                                key="theme"
                                type="button"
                                onClick={openThemeCustomizer}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full ${
                                    isThemeCustomizerOpen
                                        ? 'bg-primary/10 text-primary active-tab-glow font-medium'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                                <span>Theme</span>
                            </button>
                        );
                    }
                    const isActive =
                        item.path === location.pathname ||
                        (item.path === '/search' && location.pathname === '/search') ||
                        (item.path === '/home' && location.pathname === '/home');
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={handleNavClick}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative ${
                                isActive
                                    ? 'bg-primary/10 text-primary active-tab-glow font-medium'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                            <span>{item.label}</span>
                            {item.badge > 0 && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-red-500 text-[10px] flex items-center justify-center text-white rounded-full" aria-label={`${item.badge} unread`}>
                                    {item.badge > 99 ? '99+' : item.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <button
                type="button"
                onClick={handleCreatePost}
                className="mesh-gradient w-full h-12 min-h-12 py-3.5 rounded-xl font-semibold text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
            >
                <span className="material-symbols-outlined text-sm">add</span>
                <span>Create Post</span>
            </button>
        </aside>
    );
};

export default LeftSidebar;
