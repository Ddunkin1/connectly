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

const AppTopBar = ({ onMenuToggle, showMenuButton = false, mobileMenuOpen = false }) => {
    const navigate = useNavigate();
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
        <header className="fixed top-0 left-0 right-0 h-[60px] z-40 flex items-center px-3 sm:px-4 lg:px-6 glass-effect border-b border-white/[0.06]"
            style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
        >
            <div className="flex items-center w-full max-w-6xl mx-auto gap-2 sm:gap-4">

                {/* ── Left: hamburger + logo ── */}
                <div className="flex items-center shrink-0 sm:w-[200px] md:w-[240px]">
                    {showMenuButton && (
                        <button
                            type="button"
                            onClick={onMenuToggle}
                            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/8 text-slate-400 hover:text-slate-200 transition-all"
                            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                            aria-expanded={mobileMenuOpen}
                        >
                            <span className="material-symbols-outlined text-[22px]">
                                {mobileMenuOpen ? 'close' : 'menu'}
                            </span>
                        </button>
                    )}

                    {/* Logo — shown always (with or without hamburger) */}
                    <Link
                        to="/home"
                        className={`flex items-center gap-2 ${showMenuButton ? 'ml-1.5' : ''}`}
                    >
                        {/* Icon mark */}
                        <div className="relative shrink-0">
                            <div className={`${showMenuButton ? 'w-7 h-7' : 'w-8 h-8'} rounded-[10px] flex items-center justify-center`}
                                style={{ background: 'linear-gradient(135deg, #359EFF 0%, #7B61FF 100%)', boxShadow: '0 4px 14px rgba(53,158,255,0.35)' }}
                            >
                                <span className="text-white font-black leading-none"
                                    style={{ fontSize: showMenuButton ? '13px' : '15px', letterSpacing: '-0.5px' }}
                                >
                                    C
                                </span>
                            </div>
                        </div>

                        {/* Brand name */}
                        <span
                            className={`font-extrabold tracking-tight ${showMenuButton ? 'text-[15px]' : 'hidden sm:block text-[17px]'}`}
                            style={{ background: 'linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.65) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                        >
                            Connectly
                        </span>
                    </Link>
                </div>

                {/* ── Center: search bar (sm+) ── */}
                <div className="hidden sm:flex flex-1 justify-center items-center min-w-0">
                    <div ref={suggestionsRef} className="relative w-full max-w-xl">
                        <form onSubmit={handleSearch}>
                            <div className="relative group">
                                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary text-[20px] pointer-events-none transition-colors">
                                    search
                                </span>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                                    onFocus={() => { if (searchQuery.trim().length > 1) setShowSuggestions(true); }}
                                    placeholder="Search people, communities, topics…"
                                    className="w-full bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.14] rounded-2xl py-2 pl-10 pr-4 focus:ring-2 focus:ring-primary/40 focus:border-primary/40 focus:outline-none text-sm text-slate-200 placeholder:text-slate-600 transition-all"
                                />
                            </div>
                        </form>

                        {/* Search suggestions dropdown */}
                        {showSuggestions && (suggestionUsers.length > 0 || suggestionHashtags.length > 0 || suggestionCommunities.length > 0) && (
                            <div className="absolute left-0 right-0 top-full mt-2 z-[100] rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
                                {suggestionUsers.length > 0 && (
                                    <div className="border-b border-white/[0.06]">
                                        <p className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-[0.15em] font-semibold text-slate-500">People</p>
                                        {suggestionUsers.map((u) => (
                                            <Link key={u.id} to={`/profile/${u.username}`}
                                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-colors"
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
                                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-colors"
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
                                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-colors"
                                                onClick={() => setShowSuggestions(false)}
                                            >
                                                <div className="w-7 h-7 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0">
                                                    <span className="material-symbols-outlined text-[16px] text-violet-400">group</span>
                                                </div>
                                                <span className="text-sm text-slate-200 truncate">{c.name}</span>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Right: actions + avatar ── */}
                <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 sm:w-[200px] md:w-[240px] justify-end ml-auto">

                    {/* Mobile: search icon */}
                    <Link to="/search"
                        className="sm:hidden w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/8 transition-all"
                        aria-label="Search"
                    >
                        <span className="material-symbols-outlined text-[21px]">search</span>
                    </Link>

                    {/* Create post — styled as a pill on desktop, icon on mobile */}
                    <button
                        type="button"
                        onClick={() => setIsCreatePostOpen(true)}
                        className="sm:hidden w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/8 transition-all cursor-pointer"
                        aria-label="Create post"
                    >
                        <span className="material-symbols-outlined text-[21px]">add_circle</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsCreatePostOpen(true)}
                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-white cursor-pointer transition-all hover:opacity-90 active:scale-95"
                        style={{ background: 'linear-gradient(135deg, #359EFF 0%, #7B61FF 100%)', boxShadow: '0 2px 10px rgba(53,158,255,0.25)' }}
                        aria-label="Create post"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        <span>Create</span>
                    </button>

                    {/* Notifications (desktop) */}
                    <Link to="/notifications"
                        className="hidden sm:flex relative w-9 h-9 items-center justify-center rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/8 transition-all"
                        aria-label="Notifications"
                    >
                        <span className="material-symbols-outlined text-[21px]">notifications</span>
                        {notificationsBadge > 0 && (
                            <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                                {notificationsBadge > 9 ? '9+' : notificationsBadge}
                            </span>
                        )}
                    </Link>

                    {/* Messages (desktop) */}
                    <Link to="/messages"
                        className="hidden sm:flex relative w-9 h-9 items-center justify-center rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/8 transition-all"
                        aria-label="Messages"
                    >
                        <span className="material-symbols-outlined text-[21px]">mail</span>
                        {messagesBadge > 0 && (
                            <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                                {messagesBadge > 9 ? '9+' : messagesBadge}
                            </span>
                        )}
                    </Link>

                    {/* Theme toggle (desktop) */}
                    <button
                        type="button"
                        onClick={openThemeCustomizer}
                        className="hidden sm:flex w-9 h-9 items-center justify-center rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/8 transition-all"
                        aria-label="Theme"
                    >
                        <span className="material-symbols-outlined text-[21px]">palette</span>
                    </button>

                    {/* Divider (desktop) */}
                    <div className="hidden sm:block w-px h-5 bg-white/10 mx-1" />

                    {/* Avatar + dropdown */}
                    {user && (
                        <div className="relative ml-0.5" ref={menuRef}>
                            <button
                                type="button"
                                onClick={() => setShowProfileMenu((v) => !v)}
                                className="relative flex items-center justify-center rounded-full focus:outline-none group"
                                aria-label="Profile menu"
                                aria-expanded={showProfileMenu}
                            >
                                {/* Gradient ring */}
                                <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ background: 'linear-gradient(135deg, #359EFF, #7B61FF)', padding: '1.5px' }}
                                />
                                <div className="relative rounded-full p-[2px]"
                                    style={{ background: showProfileMenu ? 'linear-gradient(135deg, #359EFF, #7B61FF)' : 'transparent' }}
                                >
                                    <Avatar
                                        src={user.profile_picture}
                                        alt={user.name}
                                        size="sm"
                                        className="w-8 h-8 sm:w-[34px] sm:h-[34px] rounded-full object-cover ring-[1.5px] ring-white/10"
                                    />
                                </div>
                            </button>

                            {showProfileMenu && (
                                <div className="absolute right-0 mt-2.5 w-52 py-1.5 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] shadow-2xl z-50 overflow-hidden">
                                    {/* User info header */}
                                    <div className="px-4 py-2.5 border-b border-white/[0.06] mb-1">
                                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{user.name}</p>
                                        <p className="text-xs text-slate-500 truncate">@{user.username}</p>
                                    </div>

                                    <Link to={`/profile/${user.username}`}
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-white/[0.04] transition-colors"
                                        onClick={() => setShowProfileMenu(false)}
                                    >
                                        <span className="material-symbols-outlined text-[18px] text-slate-400">person</span>
                                        View profile
                                    </Link>
                                    <Link to="/settings"
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-white/[0.04] transition-colors"
                                        onClick={() => setShowProfileMenu(false)}
                                    >
                                        <span className="material-symbols-outlined text-[18px] text-slate-400">settings</span>
                                        Settings
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => { setShowProfileMenu(false); openThemeCustomizer(); }}
                                        className="sm:hidden flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-white/[0.04] transition-colors text-left"
                                    >
                                        <span className="material-symbols-outlined text-[18px] text-slate-400">palette</span>
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
