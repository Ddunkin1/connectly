import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Avatar from '../common/Avatar';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import { useLogout } from '../../hooks/useAuth';
import { useUnreadNotificationsCount } from '../../hooks/useNotifications';
import { useConversations } from '../../hooks/useConversations';
import { useQuery } from '@tanstack/react-query';
import { searchAPI } from '../../services/api';
import CreatePostModal from '../modal/createPostModal';
import { Home, Bookmark, UsersGroup, Users, Notification, Email, Search, Menu, Close, Plus } from 'griddy-icons';

const AppTopBar = ({ onMenuToggle, showMenuButton = false, mobileMenuOpen = false }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = useAuthStore((s) => s.user);
    const openThemeCustomizer = useThemeStore((s) => s.openCustomizer);
    const { data: unreadNotifications } = useUnreadNotificationsCount();
    const { data: conversationsData } = useConversations();
    const [searchQuery, setSearchQuery]       = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
    const menuRef        = useRef(null);
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

    const suggestionUsers       = suggestionsData?.users       ?? [];
    const suggestionHashtags    = suggestionsData?.hashtags    ?? [];
    const suggestionCommunities = suggestionsData?.communities ?? [];

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target))
                setShowProfileMenu(false);
            if (suggestionsRef.current && !suggestionsRef.current.contains(e.target))
                setShowSuggestions(false);
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
        <header className="fixed top-0 left-0 right-0 h-16 z-40 flex items-center px-4 sm:px-6 bg-[#f4fdf8]/75 dark:bg-[#0d1210]/75 backdrop-blur-sm border-b border-black/[0.08] dark:border-white/[0.06]">
            {/* ── Nav icons — absolute center of the full-width header = viewport center ── */}
            <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 items-center gap-6 z-10">
                {[
                    { Icon: Home,       path: '/home',        label: 'Home' },
                    { Icon: Bookmark,   path: '/bookmarks',   label: 'Bookmarks' },
                    { Icon: UsersGroup, path: '/communities', label: 'Communities' },
                    { Icon: Users,      path: '/connections', label: 'Connections' },
                ].map(({ Icon, path, label }) => {
                    const isActive = location.pathname === path;
                    return (
                        <Link key={path} to={path} aria-label={label}
                            className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all ${
                                isActive
                                    ? 'bg-[var(--theme-accent)]/20 text-[var(--theme-accent)]'
                                    : 'text-[var(--text-secondary)] hover:bg-[var(--theme-surface-hover)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            <Icon size={22} color="currentColor" />
                        </Link>
                    );
                })}
            </div>

            <div className="flex items-center justify-between w-full max-w-[1200px] mx-auto">

                {/* ── Left: logo column (w-64 for sidebar alignment) + search ── */}
                <div className="flex items-center">
                <div className="flex items-center gap-3 shrink-0">
                    {showMenuButton && (
                        <button
                            type="button"
                            onClick={onMenuToggle}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--theme-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all shrink-0"
                            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                            aria-expanded={mobileMenuOpen}
                        >
                            {mobileMenuOpen
                                ? <Close size={22} color="currentColor" />
                                : <Menu size={22} color="currentColor" />}
                        </button>
                    )}

                    <Link to="/home" className="flex flex-col leading-tight shrink-0 sm:pl-7">
                        <span className="font-bold text-xl text-[var(--text-primary)] tracking-tight">Connectly</span>
                        <span className="hidden sm:block text-[10px] text-[var(--text-secondary)] leading-none">Connect with your school</span>
                    </Link>
                </div>

                {/* ── Search bar — sits right after logo column ── */}
                <div ref={suggestionsRef} className="hidden sm:block relative w-64 ml-3">
                    <form onSubmit={handleSearch}>
                            <div className="relative group">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--theme-accent)] pointer-events-none transition-colors">
                                    <Search size={18} color="currentColor" />
                                </span>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                                    onFocus={() => { if (searchQuery.trim().length > 1) setShowSuggestions(true); }}
                                    placeholder="Search people, communities, topics…"
                                    className="w-full bg-white/60 dark:bg-white/5 border border-black/[0.08] dark:border-white/10 rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-[var(--theme-accent)]/20 focus:border-[var(--theme-accent)]/30 focus:outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] transition-all"
                                />
                            </div>
                        </form>

                        {/* Search suggestions dropdown */}
                        {showSuggestions && (suggestionUsers.length > 0 || suggestionHashtags.length > 0 || suggestionCommunities.length > 0) && (
                            <div className="absolute left-0 right-0 top-full mt-2 z-[100] rounded-xl bg-white dark:bg-[var(--theme-surface)] border border-[var(--theme-border)] shadow-lg overflow-hidden max-h-80 overflow-y-auto">
                                {suggestionUsers.length > 0 && (
                                    <div className="border-b border-white/[0.06]">
                                        <p className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-[0.15em] font-semibold text-slate-500">People</p>
                                        {suggestionUsers.map((u) => (
                                            <Link key={u.id} to={`/profile/${u.username}`}
                                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--theme-surface-hover)] transition-colors"
                                                onClick={() => setShowSuggestions(false)}
                                            >
                                                <Avatar src={u.profile_picture} alt={u.name} size="sm" className="w-7 h-7 rounded-full shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-slate-100 truncate">{u.name}</p>
                                                    <p className="text-[11px] text-slate-500 truncate">@{u.username}</p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                                {suggestionHashtags.length > 0 && (
                                    <div className="border-b border-white/[0.06]">
                                        <p className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-[0.15em] font-semibold text-slate-500">Hashtags</p>
                                        {suggestionHashtags.map((h) => (
                                            <Link key={h.id} to={`/hashtag/${encodeURIComponent(h.name)}`}
                                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--theme-surface-hover)] transition-colors"
                                                onClick={() => setShowSuggestions(false)}
                                            >
                                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                    <span className="text-primary text-xs font-bold">#</span>
                                                </div>
                                                <span className="text-sm text-slate-200">{h.name}</span>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                                {suggestionCommunities.length > 0 && (
                                    <div>
                                        <p className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-[0.15em] font-semibold text-slate-500">Communities</p>
                                        {suggestionCommunities.map((c) => (
                                            <Link key={c.id} to={`/communities/${c.id}`}
                                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--theme-surface-hover)] transition-colors"
                                                onClick={() => setShowSuggestions(false)}
                                            >
                                                <div className="w-7 h-7 rounded-full bg-[var(--theme-accent)]/10 flex items-center justify-center shrink-0">
                                                    <span className="material-symbols-outlined text-[16px] text-[var(--theme-accent)]">group</span>
                                                </div>
                                                <span className="text-sm text-[var(--text-primary)] truncate">{c.name}</span>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Right: actions + avatar ── */}
                <div className="flex items-center gap-3">

                    {/* Mobile: search icon */}
                    <Link to="/search"
                        className="sm:hidden w-9 h-9 flex items-center justify-center rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] transition-all"
                        aria-label="Search"
                    >
                        <span className="material-symbols-outlined text-[21px]">search</span>
                    </Link>

                    {/* Create post — mobile icon only (desktop uses sidebar button) */}
                    <button
                        type="button"
                        onClick={() => setIsCreatePostOpen(true)}
                        className="sm:hidden w-9 h-9 flex items-center justify-center rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] transition-all cursor-pointer"
                        aria-label="Create post"
                    >
                        <Plus size={22} color="currentColor" />
                    </button>

                    {/* Notifications (desktop) */}
                    <Link to="/notifications"
                        className="hidden sm:flex relative w-10 h-10 items-center justify-center rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] transition-all"
                        aria-label="Notifications"
                    >
                        <Notification size={22} color="currentColor" />
                        {notificationsBadge > 0 && (
                            <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                                {notificationsBadge > 9 ? '9+' : notificationsBadge}
                            </span>
                        )}
                    </Link>

                    {/* Messages (desktop) */}
                    <Link to="/messages"
                        className="hidden sm:flex relative w-10 h-10 items-center justify-center rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] transition-all"
                        aria-label="Messages"
                    >
                        <Email size={22} color="currentColor" />
                        {messagesBadge > 0 && (
                            <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                                {messagesBadge > 9 ? '9+' : messagesBadge}
                            </span>
                        )}
                    </Link>

                    {/* Divider (desktop) */}
                    <div className="hidden sm:block w-px h-5 bg-[var(--theme-border)] mx-1" />

                    {/* Avatar + dropdown */}
                    {user && (
                        <div className="relative ml-0.5" ref={menuRef}>
                            <button
                                type="button"
                                onClick={() => setShowProfileMenu((v) => !v)}
                                className="relative flex items-center justify-center rounded-full focus:outline-none"
                                aria-label="Profile menu"
                                aria-expanded={showProfileMenu}
                            >
                                <Avatar
                                    src={user.profile_picture}
                                    alt={user.name}
                                    size="sm"
                                    className={`w-8 h-8 sm:w-[34px] sm:h-[34px] rounded-full object-cover ring-2 transition-all ${showProfileMenu ? 'ring-[var(--theme-accent)]' : 'ring-transparent hover:ring-[var(--theme-accent)]/40'}`}
                                />
                            </button>

                            {showProfileMenu && (
                                <div className="absolute right-0 mt-2.5 w-52 py-1.5 rounded-xl bg-white dark:bg-[var(--theme-surface)] border border-[var(--theme-border)] shadow-lg z-50 overflow-hidden">
                                    {/* User info header */}
                                    <div className="px-4 py-2.5 border-b border-white/[0.06] mb-1">
                                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{user.name}</p>
                                        <p className="text-xs text-slate-500 truncate">@{user.username}</p>
                                    </div>

                                    <Link to={`/profile/${user.username}`}
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] transition-colors"
                                        onClick={() => setShowProfileMenu(false)}
                                    >
                                        <span className="material-symbols-outlined text-[18px] text-[var(--text-secondary)]">person</span>
                                        View profile
                                    </Link>
                                    <Link to="/settings"
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] transition-colors"
                                        onClick={() => setShowProfileMenu(false)}
                                    >
                                        <span className="material-symbols-outlined text-[18px] text-[var(--text-secondary)]">settings</span>
                                        Settings
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => { setShowProfileMenu(false); openThemeCustomizer(); }}
                                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] transition-colors text-left"
                                    >
                                        <span className="material-symbols-outlined text-[18px] text-[var(--text-secondary)]">palette</span>
                                        Appearance
                                    </button>

                                    <div className="my-1 mx-3 border-t border-white/[0.06]" />

                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        disabled={logoutMutation.isPending}
                                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/[0.08] transition-colors text-left disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">logout</span>
                                        {logoutMutation.isPending ? 'Signing out…' : 'Sign out'}
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
