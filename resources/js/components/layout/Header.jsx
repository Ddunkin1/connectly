import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLogout } from '../../hooks/useAuth';
import useAuthStore from '../../store/authStore';
import Avatar from '../common/Avatar';
import Button from '../common/Button';

const Header = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showMenu, setShowMenu] = useState(false);
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const logoutMutation = useLogout();

    const handleLogout = () => {
        logoutMutation.mutate();
        navigate('/login');
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/home" className="flex items-center space-x-2 flex-shrink-0">
                        <div className="w-8 h-8 bg-[#359EFF] rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">C</span>
                        </div>
                        <span className="text-xl font-bold text-gray-900 hidden sm:block">Connectly</span>
                    </Link>

                    {/* Search Bar - Center */}
                    <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-4 lg:mx-8">
                        <div className="relative w-full">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search communities, posts, or people"
                                className="w-full px-4 py-2 pl-10 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#359EFF] focus:border-transparent"
                            />
                            <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400">
                                search
                            </span>
                        </div>
                    </form>

                    {/* Right Side - Navigation Links, Create Post Button, User Avatar */}
                    <div className="flex items-center space-x-4 flex-shrink-0">
                        {user ? (
                            <>
                                {/* Navigation Links */}
                                <div className="hidden md:flex items-center space-x-6">
                                    <Link to="/home" className="text-sm font-medium text-gray-700 hover:text-[#359EFF] transition-colors">
                                        Home
                                    </Link>
                                    <Link to="/explore" className="text-sm font-medium text-gray-700 hover:text-[#359EFF] transition-colors">
                                        Explore
                                    </Link>
                                    <Link to="/notifications" className="text-sm font-medium text-gray-700 hover:text-[#359EFF] transition-colors">
                                        Notifications
                                    </Link>
                                </div>

                                {/* Create Post Button */}
                                <button
                                    onClick={() => navigate('/home')}
                                    className="bg-[#359EFF] hover:bg-[#2a8eef] text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
                                >
                                    Create Post
                                </button>

                                {/* User Avatar */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowMenu(!showMenu)}
                                        className="focus:outline-none"
                                    >
                                        <Avatar src={user.profile_picture} alt={user.name} size="sm" />
                                    </button>

                                    {showMenu && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                            <Link
                                                to={`/profile/${user.username}`}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                onClick={() => setShowMenu(false)}
                                            >
                                                View Profile
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                            >
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <Button variant="ghost" onClick={() => navigate('/login')}>
                                    Login
                                </Button>
                                <Button onClick={() => navigate('/register')}>Sign Up</Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
