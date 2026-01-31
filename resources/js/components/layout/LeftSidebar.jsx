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
        <aside className="hidden lg:flex lg:flex-col w-[300px] theme-bg-sidebar shrink-0 overflow-y-auto sticky top-4 rounded-2xl shadow-lg mt-4 mb-4" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
            {/* Profile card: 48px avatar, 20px padding, 12px radius, bg #1A1A1A */}
            {user && (
                <Link
                    to={`/profile/${user.username}`}
                    className="mx-5 mt-5 mb-6 p-5 rounded-[12px] theme-surface hover:bg-[#1E1E1E] transition-colors flex items-center gap-4"
                >
                    <Avatar src={user.profile_picture} alt={user.name} size="md" className="w-12 h-12 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-base font-medium text-white truncate">{user.name}</p>
                        <p className="text-sm text-[#9CA3AF] truncate">@{user.username}</p>
                    </div>
                </Link>
            )}

            {/* Navigation: 16px vertical padding, 16px icon-text gap */}
            <nav className="flex-1 px-3 py-2 space-y-0.5 min-h-0" aria-label="Main navigation">
                {navItems.map((item) => {
                    if (item.isTheme) {
                        return (
                            <button
                                key="theme"
                                type="button"
                                onClick={openThemeCustomizer}
                                className={`w-full flex items-center justify-between px-3 py-4 rounded-[12px] transition-colors ${
                                    isThemeCustomizerOpen
                                        ? 'bg-[var(--theme-accent)] text-white'
                                        : 'text-[#9CA3AF] hover:bg-[#1E1E1E] hover:text-white'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                                    <span className="text-base font-medium">Theme</span>
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
                            className={`relative flex items-center justify-between px-3 py-4 rounded-[12px] transition-colors ${
                                isActive
                                    ? 'bg-[var(--theme-accent)] text-white'
                                    : 'text-[#9CA3AF] hover:bg-[#1E1E1E] hover:text-white'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                                    {item.badge > 0 && (
                                        <span
                                            className="absolute -top-1 -right-1 w-5 h-5 bg-[#EF4444] text-white text-[12px] font-bold rounded-full flex items-center justify-center"
                                            aria-label={`${item.badge} unread`}
                                        >
                                            {item.badge > 99 ? '99+' : item.badge}
                                        </span>
                                    )}
                                </div>
                                <span className="text-base font-medium">{item.label}</span>
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* Create Post button: 48px height, purple gradient, 12px radius */}
            <div className="p-4">
                <button
                    type="button"
                    onClick={handleCreatePost}
                    className="w-full h-12 rounded-[12px] font-semibold text-base text-white flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}
                >
                    <span className="material-symbols-outlined">add</span>
                    Create Post
                </button>
            </div>
        </aside>
    );
};

export default LeftSidebar;
