import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import Avatar from '../common/Avatar';
import { useUnreadNotificationsCount } from '../../hooks/useNotifications';
import { useConversations } from '../../hooks/useConversations';

const LeftSidebar = () => {
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
        { icon: 'show_chart', label: 'Analytics', path: '/analytics' },
        { icon: 'palette', label: 'Theme', path: null, isTheme: true },
        { icon: 'settings', label: 'Settings', path: '/settings' },
    ];

    const openThemeCustomizer = useThemeStore((s) => s.openCustomizer);
    const isThemeCustomizerOpen = useThemeStore((s) => s.isCustomizerOpen);

    const handleCreatePost = () => {
        navigate('/home');
        setTimeout(() => window.dispatchEvent(new CustomEvent('open-create-post')), 100);
    };

    return (
        <aside className="hidden lg:flex lg:flex-col w-64 theme-bg-sidebar border-r border-gray-700/50 h-screen sticky top-0 overflow-y-auto">
            {/* Logo */}
            <div className="p-4">
                <Link to="/home" className="block">
                    <span className="text-xl font-bold text-white">connectly</span>
                </Link>
            </div>

            {/* User profile card */}
            {user && (
                <Link
                    to={`/profile/${user.username}`}
                    className="mx-4 mb-4 p-3 rounded-xl theme-surface hover:brightness-110 transition-colors flex items-center gap-3"
                >
                    <Avatar src={user.profile_picture} alt={user.name} size="md" />
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{user.name}</p>
                        <p className="text-sm text-gray-400 truncate">@{user.username}</p>
                    </div>
                </Link>
            )}

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1">
                {navItems.map((item) => {
                    if (item.isTheme) {
                        return (
                            <button
                                key="theme"
                                type="button"
                                onClick={openThemeCustomizer}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                                    isThemeCustomizerOpen
                                        ? 'bg-[var(--theme-accent)]/20 text-[var(--theme-accent)] border-l-4 border-[var(--theme-accent)] -ml-[2px] pl-[14px]'
                                        : 'text-gray-300 hover:bg-white/5'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <span className="material-symbols-outlined">{item.icon}</span>
                                    <span className="font-medium">Theme</span>
                                </div>
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
                            className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                                isActive
                                    ? 'bg-[var(--theme-accent)]/20 text-[var(--theme-accent)] border-l-4 border-[var(--theme-accent)] -ml-[2px] pl-[14px]'
                                    : 'text-gray-300 hover:bg-white/5'
                            }`}
                        >
                            <div className="flex items-center space-x-3">
                                <span className="material-symbols-outlined">{item.icon}</span>
                                <span className="font-medium">{item.label}</span>
                            </div>
                            {item.badge > 0 && (
                                <span className="bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                                    {item.badge > 99 ? '99+' : item.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Create Post button */}
            <div className="p-4">
                <button
                    type="button"
                    onClick={handleCreatePost}
                    className="w-full theme-accent hover:opacity-90 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined">add</span>
                    Create Post
                </button>
            </div>
        </aside>
    );
};

export default LeftSidebar;
