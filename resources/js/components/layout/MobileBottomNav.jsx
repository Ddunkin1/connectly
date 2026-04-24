import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUnreadNotificationsCount } from '../../hooks/useNotifications';
import { useConversations } from '../../hooks/useConversations';

/**
 * Fixed bottom navigation bar — visible on mobile only (hidden md+).
 * Mirrors the most-used sidebar links so one-thumb navigation works.
 */
const MobileBottomNav = () => {
    const location = useLocation();
    const { data: unreadNotifications } = useUnreadNotificationsCount();
    const { data: conversationsData } = useConversations();

    const notificationsBadge = unreadNotifications ?? 0;
    const messagesBadge =
        conversationsData?.pages
            ?.flatMap((p) => p.data?.conversations ?? [])
            ?.reduce((sum, c) => sum + (c.unread_count ?? 0), 0) ?? 0;

    const navItems = [
        { icon: 'home',          label: 'Home',      path: '/home' },
        { icon: 'explore',       label: 'Explore',   path: '/explore' },
        { icon: 'notifications', label: 'Alerts',    path: '/notifications', badge: notificationsBadge },
        { icon: 'mail',          label: 'Messages',  path: '/messages',      badge: messagesBadge },
        { icon: 'groups',        label: 'More',      path: '/communities' },
    ];

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-40 h-16 glass-effect border-t border-white/10 flex items-center justify-around px-1 md:hidden safe-area-bottom"
            aria-label="Mobile navigation"
        >
            {navItems.map((item) => {
                const isActive =
                    location.pathname === item.path ||
                    (item.path !== '/home' && location.pathname.startsWith(item.path));
                return (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-xl transition-colors ${
                            isActive ? 'text-primary' : 'text-slate-500 active:text-slate-300'
                        }`}
                        aria-label={item.label}
                    >
                        <span
                            className={`material-symbols-outlined text-[26px] leading-none ${
                                isActive ? 'text-primary' : 'text-slate-400'
                            }`}
                        >
                            {item.icon}
                        </span>
                        <span className="text-[10px] font-medium leading-none">{item.label}</span>
                        {item.badge > 0 && (
                            <span className="absolute top-1.5 right-[calc(50%-8px)] min-w-[16px] h-4 px-1 bg-red-500 text-[9px] flex items-center justify-center text-white rounded-full font-bold">
                                {item.badge > 9 ? '9+' : item.badge}
                            </span>
                        )}
                    </Link>
                );
            })}
        </nav>
    );
};

export default MobileBottomNav;
