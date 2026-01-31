import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications, useUnreadNotificationsCount, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from '../../hooks/useNotifications';
import NotificationItem from '../notifications/NotificationItem';
import LoadingSpinner from '../common/LoadingSpinner';

const NotificationDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const { data, isLoading } = useNotifications();
    const { data: unreadCount } = useUnreadNotificationsCount();
    const markAsReadMutation = useMarkNotificationAsRead();
    const markAllAsReadMutation = useMarkAllNotificationsAsRead();

    const notifications = data?.notifications || [];
    const count = unreadCount ?? 0;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = (id) => {
        markAsReadMutation.mutate(id);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-400 hover:text-purple-400 hover:bg-white/10 rounded-lg transition-colors"
                title="Notifications"
            >
                <span className="material-symbols-outlined text-2xl">notifications</span>
                {count > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-medium rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {count > 99 ? '99+' : count}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 max-h-[80vh] bg-white rounded-lg shadow-lg border border-gray-200 z-50 flex flex-col">
                    <div className="flex items-center justify-between p-3 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        {count > 0 && (
                            <button
                                onClick={() => markAllAsReadMutation.mutate()}
                                className="text-sm text-[#359EFF] hover:underline"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>
                    <div className="overflow-y-auto flex-1">
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <LoadingSpinner size="sm" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-6 text-center text-gray-400 text-sm">
                                No notifications yet
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    onMarkAsRead={handleMarkAsRead}
                                />
                            ))
                        )}
                    </div>
                    <Link
                        to="/notifications"
                        onClick={() => setIsOpen(false)}
                        className="p-3 text-center text-sm text-purple-400 hover:bg-white/5 border-t border-gray-700 font-medium"
                    >
                        View all notifications
                    </Link>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
