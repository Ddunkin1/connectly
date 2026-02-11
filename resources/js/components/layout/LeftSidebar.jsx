import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import Avatar from '../common/Avatar';
import { UilHome, UilCompass, UilBell, UilEnvelope, UilBookmark, UilAnalytics, UilPalette, UilSetting, UilPlus } from '../common/Icons';
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
        { Icon: UilHome, label: 'Home', path: '/home' },
        { Icon: UilCompass, label: 'Explore', path: '/search' },
        { Icon: UilBell, label: 'Notifications', path: '/notifications', badge: notificationsBadge },
        { Icon: UilEnvelope, label: 'Messages', path: '/messages', badge: messagesBadge },
        { Icon: UilBookmark, label: 'Bookmarks', path: '/bookmarks' },
        { Icon: UilAnalytics, label: 'Analytics', path: '/analytics' },
        { Icon: UilPalette, label: 'Theme', path: null, isTheme: true },
        { Icon: UilSetting, label: 'Settings', path: '/settings' },
    ];

    const openThemeCustomizer = useThemeStore((s) => s.openCustomizer);
    const isThemeCustomizerOpen = useThemeStore((s) => s.isCustomizerOpen);

    const handleCreatePost = () => {
        navigate('/home');
        setTimeout(() => window.dispatchEvent(new CustomEvent('open-create-post')), 100);
    };

    return (
        <aside className="hidden lg:flex lg:flex-col w-[340px] self-start max-h-[calc(100vh-56px)] theme-bg-sidebar shrink-0 overflow-y-auto rounded-2xl shadow-lg" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
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
            <nav className="px-3 py-2 space-y-0.5" aria-label="Main navigation">
                {navItems.map((item) => {
                    if (item.isTheme) {
                        return (
                            <button
                                key="theme"
                                type="button"
                                onClick={openThemeCustomizer}
                                className={`w-full flex items-center justify-between py-4 rounded-[12px] border-l-4 transition-colors ${
                                    isThemeCustomizerOpen
                                        ? 'border-[var(--theme-accent)] pl-[8px] pr-3 text-[var(--theme-accent)]'
                                        : 'border-transparent px-3 text-[#9CA3AF] hover:bg-[#1E1E1E] hover:text-white'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <item.Icon size={24} color="currentColor" />
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
                            className={`relative flex items-center justify-between py-4 rounded-[12px] border-l-4 transition-colors ${
                                isActive
                                    ? 'border-[var(--theme-accent)] pl-[8px] pr-3 text-[var(--theme-accent)]'
                                    : 'border-transparent px-3 text-[#9CA3AF] hover:bg-[#1E1E1E] hover:text-white'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <item.Icon size={24} color="currentColor" />
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

            {/* Create Post button: 48px height, purple gradient, 12px radius - close to Settings */}
            <div className="px-4 pt-2 pb-4">
                <button
                    type="button"
                    onClick={handleCreatePost}
                    className="w-full h-12 rounded-[12px] font-semibold text-base text-white flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}
                >
                    <UilPlus size={20} color="white" />
                    Create Post
                </button>
            </div>
        </aside>
    );
};

export default LeftSidebar;
