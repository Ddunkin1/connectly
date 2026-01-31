import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Avatar from '../common/Avatar';
import { UilSearch } from '../common/Icons';
import useAuthStore from '../../store/authStore';

const AppTopBar = () => {
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    };

    const handleCreate = () => {
        navigate('/home');
        setTimeout(() => window.dispatchEvent(new CustomEvent('open-create-post')), 100);
    };

    return (
        <header className="theme-bg-sidebar border-b border-[#2A2A2A] shrink-0 w-full">
            <div className="w-full px-4 lg:px-6 py-3 flex items-center">
                <div className="flex-1 flex items-center min-w-0">
                    <Link to="/home" className="shrink-0">
                        <span className="text-xl font-semibold text-white tracking-tight">connectly</span>
                    </Link>
                </div>
                <div className="flex-1 flex justify-center items-center min-w-0 px-4">
                    <form onSubmit={handleSearch} className="w-full max-w-[600px]">
                        <div className="relative w-full">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
                            <UilSearch size={22} color="currentColor" />
                        </span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search for creators, inspirations, and projects"
                                className="w-full h-12 pl-12 pr-4 bg-[#1A1A1A] border border-transparent rounded-[24px] text-white placeholder-[#9CA3AF] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]"
                            />
                        </div>
                    </form>
                </div>
                <div className="flex-1 flex items-center justify-end min-w-0">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleCreate}
                            className="h-10 px-6 rounded-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-medium text-sm transition-colors"
                        >
                            Create
                        </button>
                        {user && (
                            <Link to={`/profile/${user.username}`}>
                                <Avatar src={user.profile_picture} alt={user.name} size="sm" />
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default AppTopBar;
