import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Avatar from '../common/Avatar';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import { useLogout } from '../../hooks/useAuth';
import { useUnreadNotificationsCount } from '../../hooks/useNotifications';
import { useConversations } from '../../hooks/useConversations';
import { useQuery } from '@tanstack/react-query';
import { searchAPI } from '../../services/api';
import CreatePostModal from '../modal/createPostModal';

const AppTopBar = ({ onMenuToggle, showMenuButton = false }) => {
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const openThemeCustomizer = useThemeStore((s) => s.openCustomizer);
    const { data: unreadNotifications } = useUnreadNotificationsCount();
    const { data: conversationsData } = useConversations();
    const [searchQuery, setSearchQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
    const menuRef = useRef(null);
    const suggestionsRef = useRef(null);
    const logoutMutation = useLogout();

    const notificationsBadge = unreadNotifications ?? 0;
    const messagesBadge =
        conversationsData?.pages
            ?.flatMap((p) => p.data?.conversations ?? [])
            ?.reduce((sum, c) => sum + (c.unread_count ?? 0), 0) ?? 0;

    const { data: suggestionsData } = useQuery({
        queryKey: ['search-suggestions', searchQuery],
        queryFn: () => searchAPI.suggestions(searchQuery),
        select: (res) => res.data ?? {},
        enabled: searchQuery.trim().length > 1,
    });

    const suggestionUsers = suggestionsData?.users ?? [];
    const suggestionHashtags = suggestionsData?.hashtags ?? [];
    const suggestionCommunities = suggestionsData?.communities ?? [];

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowProfileMenu(false);
            }
            if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
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
        setShowSuggestions(false);
    };

    return (
        <header className="fixed top-0 left-0 right-0 h-[60px] z-40 flex items-center px-4 lg:px-6 glass-effect border-b border-white/5">
            <div className="flex items-center justify-between w-full max-w-6xl mx-auto">
                {/* Left: Hamburger (mobile) or Logo */}
                <div className="flex items-center w-[240px] shrink-0">
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
                            <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">connectly</span>
                        </Link>
                    )}
                </div>

                {/* Search bar - centered in header */}
                <div
                    ref={suggestionsRef}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl px-4"
                >
                    <form onSubmit={handleSearch}>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                onFocus={() => {
                                    if (searchQuery.trim().length > 1) setShowSuggestions(true);
                                }}
                                placeholder="Search creators, communities, and topics..."
                                className="w-full bg-white/5 border-none rounded-2xl py-2.5 pl-12 pr-4 focus:ring-2 focus:ring-primary/50 focus:outline-none text-sm text-white placeholder:text-slate-500 transition-standard"
                            />
                        </div>
                    </form>
                    {showSuggestions && (suggestionUsers.length > 0 || suggestionHashtags.length > 0 || suggestionCommunities.length > 0) && (
                        <div className="mt-2 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] shadow-xl overflow-hidden max-h-80 overflow-y-auto">
                            {suggestionUsers.length > 0 && (
                                <div className="border-b border-white/5">
                                    <p className="px-4 pt-3 pb-1 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                                        Users
                                    </p>
                                    {suggestionUsers.map((u) => (
                                        <Link
                                            key={u.id}
                                            to={`/profile/${u.username}`}
                                            className="flex items-center gap-2 px-4 py-2.5 hover:bg-white/5"
                                            onClick={() => setShowSuggestions(false)}
                                        >
                                            <Avatar
                                                src={u.profile_picture}
                                                alt={u.name}
                                                size="sm"
                                                className="w-7 h-7 rounded-full"
                                            />
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-slate-100 truncate">
                                                    {u.name}
                                                </p>
                                                <p className="text-[11px] text-slate-500 truncate">
                                                    @{u.username}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                            {suggestionHashtags.length > 0 && (
                                <div className="border-b border-white/5">
                                    <p className="px-4 pt-3 pb-1 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                                        Hashtags
                                    </p>
                                    {suggestionHashtags.map((h) => (
                                        <Link
                                            key={h.id}
                                            to={`/search?q=%23${encodeURIComponent(h.name)}&type=hashtags`}
                                            className="flex items-center gap-2 px-4 py-2.5 hover:bg-white/5 text-xs text-slate-100"
                                            onClick={() => setShowSuggestions(false)}
                                        >
                                            <span className="text-primary">#{h.name}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                            {suggestionCommunities.length > 0 && (
                                <div>
                                    <p className="px-4 pt-3 pb-1 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                                        Communities
                                    </p>
                                    {suggestionCommunities.map((c) => (
                                        <Link
                                            key={c.id}
                                            to={`/communities/${c.id}`}
                                            className="flex items-center gap-2 px-4 py-2.5 hover:bg-white/5 text-xs text-slate-100"
                                            onClick={() => setShowSuggestions(false)}
                                        >
                                            <span className="material-symbols-outlined text-[18px] text-slate-300">
                                                group
                                            </span>
                                            <span className="truncate">{c.name}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right: High-frequency actions and profile */}
                <div className="flex items-center gap-4 w-[240px] shrink-0 justify-end">
                    {/* Notifications shortcut */}
                    <Link
                        to="/notifications"
                        className="relative p-2 rounded-xl hover:bg-white/5 text-slate-300"
                        aria-label="Notifications"
                    >
                        <span className="material-symbols-outlined">notifications</span>
                        {notificationsBadge > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                                {notificationsBadge > 9 ? '9+' : notificationsBadge}
                            </span>
                        )}
                    </Link>
                    {/* Create post */}
                    <button
                        type="button"
                        onClick={() => setIsCreatePostOpen(true)}
                        className="p-2 rounded-xl hover:bg-white/5 text-slate-300 cursor-pointer"
                        aria-label="Create post"
                    >
                        <span className="material-symbols-outlined">add</span>
                    </button>
                    {/* Messages shortcut */}
                    <Link
                        to="/messages"
                        className="relative p-2 rounded-xl hover:bg-white/5 text-slate-300"
                        aria-label="Messages"
                    >
                        <span className="material-symbols-outlined">mail</span>
                        {messagesBadge > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                                {messagesBadge > 9 ? '9+' : messagesBadge}
                            </span>
                        )}
                    </Link>
                    {/* Theme toggle */}
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
                                <div className="absolute right-0 mt-2 w-48 py-2 rounded-xl theme-surface border border-[var(--theme-border)] shadow-xl z-50">
                                    <p className="px-4 py-1.5 text-xs text-slate-500 truncate border-b border-white/5 mb-1">
                                        @{user.username}
                                    </p>
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
            <CreatePostModal
                isOpen={isCreatePostOpen}
                onClose={() => setIsCreatePostOpen(false)}
            />
        </header>
    );
};

export default AppTopBar;
