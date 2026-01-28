import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const LeftSidebar = () => {
    const location = useLocation();
    const user = useAuthStore((state) => state.user);

    const navItems = [
        { icon: 'home', label: 'Home', path: '/home' },
        { icon: 'group', label: 'Communities', path: '/communities' },
        { icon: 'chat', label: 'Messages', path: '/messages', badge: 4 },
        { icon: 'notifications', label: 'Notifications', path: '/notifications' },
        { icon: 'settings', label: 'Settings', path: '/settings' },
    ];

    // Mock joined communities - replace with real data
    const joinedCommunities = [
        { id: 1, name: 'Tech Enthusiasts', icon: 'memory', path: '/communities/tech-enthusiasts' },
        { id: 2, name: 'UI/UX Design', icon: 'eco', path: '/communities/ui-ux-design' },
        { id: 3, name: 'Web Dev 2024', icon: 'computer', path: '/communities/web-dev-2024' },
    ];

    return (
        <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto flex flex-col">
            {/* Primary Navigation */}
            <nav className="p-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                                isActive
                                    ? 'bg-blue-50 text-[#359EFF]'
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <div className="flex items-center space-x-3">
                                <span className="material-symbols-outlined">{item.icon}</span>
                                <span className="font-medium">{item.label}</span>
                            </div>
                            {item.badge && (
                                <span className="bg-[#359EFF] text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Joined Communities Section */}
            <div className="px-4 mt-4 border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Joined Communities</h3>
                <div className="space-y-2">
                    {joinedCommunities.map((community) => (
                        <Link
                            key={community.id}
                            to={community.path}
                            className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors group"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                                    <span className="material-symbols-outlined text-gray-600 text-lg">
                                        {community.icon}
                                    </span>
                                </div>
                                <span className="text-sm font-medium text-gray-700 group-hover:text-[#359EFF]">
                                    {community.name}
                                </span>
                            </div>
                            <span className="material-symbols-outlined text-gray-400 text-sm">
                                chevron_right
                            </span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Footer Links */}
            <div className="mt-auto px-4 pb-4 border-t border-gray-200 pt-4">
                <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                    <Link to="/privacy" className="hover:text-[#359EFF] transition-colors">
                        Privacy Policy
                    </Link>
                    <Link to="/terms" className="hover:text-[#359EFF] transition-colors">
                        Terms
                    </Link>
                </div>
                <p className="text-xs text-gray-400">©2024 Connectly Inc.</p>
            </div>
        </aside>
    );
};

export default LeftSidebar;
