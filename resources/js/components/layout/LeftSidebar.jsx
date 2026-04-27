import React, { useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Explore, UsersGroup, ChartBar, Settings } from 'griddy-icons';
import useAuthStore from '../../store/authStore';
import { useLogout } from '../../hooks/useAuth';
import { useStories } from '../../hooks/useStories';
import Avatar from '../common/Avatar';
import CreatePostModal from '../modal/createPostModal';
import StoryViewer from '../feed/StoryViewer';

const LeftSidebar = ({ className = '', onNavigate, positionBelowNav = false }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
    const [showAvatarMenu, setShowAvatarMenu] = useState(false);
    const [storyViewerOpen, setStoryViewerOpen] = useState(false);
    const avatarBtnRef = useRef(null);

    const { data: storiesGrouped = [] } = useStories();
    const ownStoryGroup = storiesGrouped.find((g) => g.user?.id === user?.id);
    const hasActiveStory = !!ownStoryGroup;
    const ownStoryIndex = hasActiveStory ? storiesGrouped.indexOf(ownStoryGroup) : -1;

    const navItems = [
        { Icon: Explore,    label: 'Explore',     path: '/explore' },
        { Icon: UsersGroup, label: 'Communities',  path: '/communities' },
        { Icon: ChartBar,   label: 'Analytics',    path: '/analytics' },
        { Icon: Settings,   label: 'Settings',     path: '/settings' },
    ];

    const logoutMutation = useLogout();

    const handleLogout = () => {
        logoutMutation.mutate(undefined, {
            onSettled: () => navigate('/login', { replace: true }),
        });
    };

    const handleNavClick = () => { onNavigate?.(); };

    const handleAvatarClick = (e) => {
        if (hasActiveStory) {
            e.preventDefault();
            setShowAvatarMenu((v) => !v);
        }
        // if no story, the Link handles navigation normally
    };

    const wrapperClass = `w-64 flex flex-col px-4 pt-4 pb-4 bg-transparent z-30 overflow-y-auto h-full ${className}`.trim();

    return (
        <aside className={wrapperClass}>
            {/* User row */}
            {user && (
                <div className="relative mb-5">
                    <Link
                        ref={avatarBtnRef}
                        to={`/profile/${user.username}`}
                        onClick={handleAvatarClick}
                        className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-[var(--theme-surface-hover)] transition-colors"
                    >
                        {/* Avatar with optional story ring */}
                        <div
                            className="rounded-full shrink-0 p-[2px]"
                            style={hasActiveStory ? {
                                background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
                            } : {}}
                        >
                            <div className={`rounded-full ${hasActiveStory ? 'p-[1.5px] bg-[var(--theme-bg-main,#0d1210)]' : ''}`}>
                                <Avatar
                                    src={user.profile_picture}
                                    alt={user.name}
                                    size="sm"
                                    className="w-8 h-8 rounded-full"
                                />
                            </div>
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{user.name}</p>
                            <p className="text-xs text-[var(--text-secondary)] truncate">@{user.username}</p>
                        </div>
                    </Link>

                    {/* Story / Profile context menu */}
                    {showAvatarMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowAvatarMenu(false)} />
                            <div className="absolute left-0 top-full mt-1 w-44 rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)] shadow-2xl z-50 overflow-hidden py-1">
                                <button
                                    type="button"
                                    onClick={() => { setStoryViewerOpen(true); setShowAvatarMenu(false); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[18px] text-[var(--theme-accent)]">auto_stories</span>
                                    View story
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { navigate(`/profile/${user.username}`); setShowAvatarMenu(false); handleNavClick(); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[18px] text-[var(--text-secondary)]">person</span>
                                    View profile
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Nav */}
            <nav className="flex-1 space-y-1" aria-label="Main navigation">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={handleNavClick}
                            className={`group flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative ${
                                isActive
                                    ? 'bg-[var(--theme-accent)]/20 text-[var(--theme-accent)] font-medium'
                                    : 'text-[var(--text-secondary)] hover:bg-[var(--theme-surface-hover)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            <item.Icon size={22} color="currentColor" filled={isActive} />
                            <span className="text-[15px]">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom actions */}
            <div className="mt-5 space-y-2 px-1">
                <button
                    type="button"
                    onClick={() => setIsCreatePostOpen(true)}
                    className="w-full py-3 rounded-full bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white text-sm font-medium transition-colors"
                >
                    + Create Post
                </button>
                <button
                    type="button"
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className="w-full py-2 text-sm text-[var(--text-secondary)] hover:text-red-500 transition-colors text-center disabled:opacity-50"
                >
                    {logoutMutation.isPending ? 'Logging out...' : 'Log out'}
                </button>
            </div>

            <CreatePostModal
                isOpen={isCreatePostOpen}
                onClose={() => setIsCreatePostOpen(false)}
            />

            {/* Story viewer launched from sidebar */}
            {storyViewerOpen && storiesGrouped.length > 0 && ownStoryIndex >= 0 && (
                <StoryViewer
                    storiesGrouped={storiesGrouped}
                    initialUserIndex={ownStoryIndex}
                    onClose={() => setStoryViewerOpen(false)}
                />
            )}
        </aside>
    );
};

export default LeftSidebar;
