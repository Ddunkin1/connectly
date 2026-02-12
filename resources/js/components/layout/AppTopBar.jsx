import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Avatar from '../common/Avatar';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import { useLogout } from '../../hooks/useAuth';

const AppTopBar = ({ onMenuToggle, showMenuButton = false }) => {
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const openThemeCustomizer = useThemeStore((s) => s.openCustomizer);
    const [searchQuery, setSearchQuery] = useState('');
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const menuRef = useRef(null);
    const logoutMutation = useLogout();

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setShowProfileMenu(false);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleLogout = () => {
        setShowProfileMenu(false);
        logoutMutation.mutate(undefined, {
            onSettled: () => navigate('/login', { replace: true }),
        });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    };

    const handleCreatePost = () => {
        navigate('/home');
        setTimeout(() => window.dispatchEvent(new CustomEvent('open-create-post')), 100);
    };

    return (
        <header className="fixed top-0 left-0 right-0 h-[60px] z-40 flex items-center px-4 lg:px-6 glass-effect border-b border-white/5">
            <div className="flex items-center justify-between w-full max-w-[1600px] mx-auto">
                {/* Left: Hamburger (mobile) or Logo */}
                <div className="flex items-center w-[250px] shrink-0">
                    {showMenuButton ? (
                        <button
                            type="button"
                            onClick={onMenuToggle}
                            className="p-2 rounded-xl hover:bg-white/5 text-slate-300 lg:hidden"
                            aria-label="Open menu"
                        >
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                    ) : (
                        <Link to="/home" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-xl">hub</span>
                            </div>
                            <span className="text-xl font-bold tracking-tight text-white">connectly</span>
                        </Link>
                    )}
                </div>

                {/* Search bar - centered in header */}
                <form onSubmit={handleSearch} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl px-4">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search creators, inspirations, and projects..."
                            className="w-full bg-white/5 border-none rounded-2xl py-2.5 pl-12 pr-4 focus:ring-2 focus:ring-primary/50 focus:outline-none text-sm text-white placeholder:text-slate-500 transition-standard"
                        />
                    </div>
                </form>

                {/* Right: Buttons and profile */}
                <div className="flex items-center gap-3 w-[320px] shrink-0 justify-end">
                    {/* Create button */}
                    <button
                        type="button"
                        onClick={handleCreatePost}
                        className="bg-primary hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] text-white px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 transition-all duration-200"
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                        <span className="hidden sm:inline">Create</span>
                    </button>
                    <button
                        type="button"
                        onClick={openThemeCustomizer}
                        className="p-2 rounded-xl hover:bg-white/5 text-slate-300"
                        aria-label="Theme"
                    >
                        <span className="material-symbols-outlined">dark_mode</span>
                    </button>
                    {user && (
                        <div className="relative" ref={menuRef}>
                            <button
                                type="button"
                                onClick={() => setShowProfileMenu((v) => !v)}
                                className="rounded-xl border-2 border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                aria-label="Profile menu"
                                aria-expanded={showProfileMenu}
                            >
                                <Avatar src={user.profile_picture} alt={user.name} size="sm" className="w-9 h-9 rounded-xl object-cover" />
                            </button>
                            {showProfileMenu && (
                                <div className="absolute right-0 mt-2 w-48 py-1 rounded-xl theme-surface border border-[var(--theme-border)] shadow-xl z-50">
                                    <Link
                                        to={`/profile/${user.username}`}
                                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)]"
                                        onClick={() => setShowProfileMenu(false)}
                                    >
                                        <span className="material-symbols-outlined text-lg">person</span>
                                        Profile
                                    </Link>
                                    <Link
                                        to="/settings"
                                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)]"
                                        onClick={() => setShowProfileMenu(false)}
                                    >
                                        <span className="material-symbols-outlined text-lg">settings</span>
                                        Settings
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        disabled={logoutMutation.isPending}
                                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 text-left"
                                    >
                                        <span className="material-symbols-outlined text-lg">logout</span>
                                        {logoutMutation.isPending ? 'Logging out...' : 'Log out'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default AppTopBar;
