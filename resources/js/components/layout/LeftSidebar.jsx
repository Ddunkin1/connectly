import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Explore, Notification, Email, ChartBar, Settings } from 'griddy-icons';
import useAuthStore from '../../store/authStore';
import { useLogout } from '../../hooks/useAuth';
import Avatar from '../common/Avatar';
import { useUnreadNotificationsCount } from '../../hooks/useNotifications';
import { useConversations } from '../../hooks/useConversations';
import CreatePostModal from '../modal/createPostModal';

const LeftSidebar = ({ className = '', onNavigate, positionBelowNav = false }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const { data: unreadNotifications } = useUnreadNotificationsCount();
    const { data: conversationsData } = useConversations();
    const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

    const notificationsBadge = unreadNotifications ?? 0;
    const messagesBadge = conversationsData?.pages
        ?.flatMap((p) => p.data?.conversations ?? [])
        ?.reduce((sum, c) => sum + (c.unread_count ?? 0), 0) ?? 0;

    const navItems = [
        { Icon: Explore,      label: 'Explore',       path: '/explore' },
        { Icon: Notification, label: 'Notifications', path: '/notifications', badge: notificationsBadge },
        { Icon: Email,        label: 'Messages',      path: '/messages', badge: messagesBadge },
        { Icon: ChartBar,     label: 'Analytics',     path: '/analytics' },
        { Icon: Settings,     label: 'Settings',      path: '/settings' },
    ];

    const logoutMutation = useLogout();

    const handleLogout = () => {
        logoutMutation.mutate(undefined, {
            onSettled: () => navigate('/login', { replace: true }),
        });
    };

    const handleNavClick = () => { onNavigate?.(); };

    const wrapperClass = `w-64 flex flex-col px-4 pt-4 pb-4 bg-transparent z-30 overflow-y-auto h-full ${className}`.trim();

    return (
        <aside className={wrapperClass}>
            {/* User row */}
            {user && (
                <Link
                    to={`/profile/${user.username}`}
                    onClick={handleNavClick}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-[var(--theme-surface-hover)] transition-colors mb-5"
                >
                    <Avatar
                        src={user.profile_picture}
                        alt={user.name}
                        size="sm"
                        className="w-8 h-8 rounded-full shrink-0"
                    />
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{user.name}</p>
                        <p className="text-xs text-[var(--text-secondary)] truncate">@{user.username}</p>
                    </div>
                </Link>
            )}

            {/* Nav */}
            <nav className="flex-1 space-y-1" aria-label="Main navigation">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={handleNavClick}
                            className={`group flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative ${
                                isActive
                                    ? 'bg-[var(--theme-accent)]/20 text-[var(--theme-accent)] font-medium'
                                    : 'text-[var(--text-secondary)] hover:bg-[var(--theme-surface-hover)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            <item.Icon size={22} color="currentColor" filled={isActive} />
                            <span className="text-[15px]">{item.label}</span>
                            {item.badge > 0 && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 min-w-[18px] h-[18px] px-1 bg-red-500 text-[10px] flex items-center justify-center text-white rounded-full font-bold">
                                    {item.badge > 99 ? '99+' : item.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom actions */}
            <div className="mt-5 space-y-2 px-1">
                <button
                    type="button"
                    onClick={() => setIsCreatePostOpen(true)}
                    className="w-full py-3 rounded-full bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white text-sm font-medium transition-colors"
                >
                    + Create Post
                </button>
                <button
                    type="button"
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className="w-full py-2 text-sm text-[var(--text-secondary)] hover:text-red-500 transition-colors text-center disabled:opacity-50"
                >
                    {logoutMutation.isPending ? 'Logging out...' : 'Log out'}
                </button>
            </div>

            <CreatePostModal
                isOpen={isCreatePostOpen}
                onClose={() => setIsCreatePostOpen(false)}
            />
        </aside>
    );
};

export default LeftSidebar;
