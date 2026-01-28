import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const LeftSidebar = () => {
    const location = useLocation();
    const user = useAuthStore((state) => state.user);

    const navItems = [
        { icon: 'home', label: 'Home', path: '/home' },
        { icon: 'explore', label: 'Explore', path: '/explore' },
        { icon: 'group', label: 'Communities', path: '/communities' },
        { icon: 'bookmark', label: 'Bookmarks', path: '/bookmarks' },
        { icon: 'person', label: 'Profile', path: user ? `/profile/${user.username}` : '/login' },
    ];

    return (
        <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
            <nav className="p-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                                isActive
                                    ? 'bg-[#359EFF] text-white'
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <span className="material-symbols-outlined">{item.icon}</span>
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Trending Topics */}
            <div className="p-4 border-t border-gray-200 mt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Trending</h3>
                <div className="space-y-2">
                    {['#coding', '#webdev', '#react', '#laravel'].map((tag) => (
                        <Link
                            key={tag}
                            to={`/hashtag/${tag.replace('#', '')}`}
                            className="block text-sm text-[#359EFF] hover:underline"
                        >
                            {tag}
                        </Link>
                    ))}
                </div>
            </div>
        </aside>
    );
};

export default LeftSidebar;
