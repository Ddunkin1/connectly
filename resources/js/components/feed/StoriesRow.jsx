import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { useStories } from '../../hooks/useStories';
import CreateStoryModal from './CreateStoryModal';
import StoryViewer from './StoryViewer';
import Avatar from '../common/Avatar';
import LoadingSpinner from '../common/LoadingSpinner';

const StoryContextMenu = ({ group, anchorRect, onViewStory, onClose, navigate }) => {
    if (!anchorRect) return null;

    const MENU_W = 160;
    const MENU_H = 100;
    const GAP = 8;

    // Try to appear above the bubble; fall back to below if not enough room
    let top = anchorRect.top - MENU_H - GAP;
    if (top < 8) top = anchorRect.bottom + GAP;

    let left = anchorRect.left + anchorRect.width / 2 - MENU_W / 2;
    if (left < 8) left = 8;
    if (left + MENU_W > window.innerWidth - 8) left = window.innerWidth - MENU_W - 8;

    return (
        <>
            {/* Invisible backdrop to catch outside clicks */}
            <div className="fixed inset-0 z-[90]" onClick={onClose} />

            <div
                className="fixed z-[91] bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-2xl shadow-2xl overflow-hidden"
                style={{ top, left, width: MENU_W }}
            >
                {/* User identity strip */}
                <div className="flex items-center gap-2 px-3 pt-3 pb-2 border-b border-[var(--theme-border)]">
                    <Avatar src={group.user?.profile_picture} alt={group.user?.name} size="xs" className="w-6 h-6 rounded-full shrink-0" />
                    <span className="text-xs font-semibold text-[var(--text-primary)] truncate">{group.user?.name}</span>
                </div>

                <button
                    type="button"
                    onClick={onViewStory}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] transition-colors"
                >
                    <span className="material-symbols-outlined text-[18px] text-[var(--theme-accent)]">auto_stories</span>
                    View story
                </button>

                <button
                    type="button"
                    onClick={() => { navigate(`/profile/${group.user?.username}`); onClose(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] transition-colors"
                >
                    <span className="material-symbols-outlined text-[18px] text-[var(--text-secondary)]">person</span>
                    View profile
                </button>
            </div>
        </>
    );
};

const StoriesRow = () => {
    const user = useAuthStore((s) => s.user);
    const navigate = useNavigate();
    const { data: storiesGrouped = [], isLoading, refetch } = useStories();
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerStartIndex, setViewerStartIndex] = useState(0);
    const [menuState, setMenuState] = useState(null); // { groupIndex, anchorRect }

    const openViewer = (userIndex) => {
        setMenuState(null);
        setViewerStartIndex(userIndex);
        setViewerOpen(true);
    };

    const handleStoryClick = useCallback((e, index) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMenuState({ groupIndex: index, anchorRect: rect });
    }, []);

    const handleStoryCreated = () => {
        setCreateModalOpen(false);
        refetch().then((result) => {
            const stories = result.data ?? [];
            const idx = stories.findIndex((g) => g.user?.id === user?.id);
            if (idx >= 0) {
                setViewerStartIndex(idx);
                setViewerOpen(true);
            }
        });
    };

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-[var(--theme-surface)] rounded-2xl shadow-sm border border-black/[0.06] dark:border-white/[0.06] px-4 py-3">
                <div className="flex gap-4 overflow-x-auto scrollbar-hide items-start">
                    <div className="flex items-center justify-center w-14 h-14 shrink-0">
                        <LoadingSpinner size="sm" />
                    </div>
                </div>
            </div>
        );
    }

    const activeGroup = menuState !== null ? storiesGrouped[menuState.groupIndex] : null;

    return (
        <>
            <div className="bg-white dark:bg-[var(--theme-surface)] rounded-2xl shadow-sm border border-black/[0.06] dark:border-white/[0.06] px-4 py-3">
                <div className="flex gap-4 overflow-x-auto scrollbar-hide items-start">
                    {user && (
                        <button
                            type="button"
                            onClick={() => setCreateModalOpen(true)}
                            className="flex flex-col items-center flex-shrink-0 cursor-pointer"
                            aria-label="Add your story"
                        >
                            <div className="w-14 h-14 rounded-full border-2 border-dashed border-[var(--theme-accent)] flex items-center justify-center bg-transparent">
                                <span className="text-[var(--theme-accent)] text-2xl font-bold leading-none">+</span>
                            </div>
                            <span className="text-[11px] font-medium text-[var(--theme-accent)] mt-1.5 text-center">Add Story</span>
                        </button>
                    )}

                    {storiesGrouped.map((group, index) => {
                        const hasRing = group.has_unviewed;
                        const isMenuOpen = menuState?.groupIndex === index;
                        return (
                            <button
                                key={group.user?.id}
                                type="button"
                                onClick={(e) => handleStoryClick(e, index)}
                                className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
                                aria-label={`${group.user?.name}'s story`}
                            >
                                <div
                                    className={`p-[2px] rounded-full transition-transform ${isMenuOpen ? 'scale-110' : 'group-hover:scale-105'}`}
                                    style={hasRing ? {
                                        background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
                                    } : {
                                        background: 'transparent',
                                        padding: 0,
                                    }}
                                >
                                    <div className={`rounded-full p-[2px] ${hasRing ? 'bg-white dark:bg-[var(--theme-surface)]' : 'ring-2 ring-gray-200 dark:ring-white/10'}`}>
                                        <Avatar
                                            src={group.user?.profile_picture}
                                            alt={group.user?.name}
                                            size="lg"
                                        />
                                    </div>
                                </div>
                                <span className="text-[11px] text-[var(--text-primary)] truncate max-w-[56px] mt-1.5 text-center">
                                    {group.user?.name}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Context menu */}
            {menuState !== null && activeGroup && (
                <StoryContextMenu
                    group={activeGroup}
                    anchorRect={menuState.anchorRect}
                    onViewStory={() => openViewer(menuState.groupIndex)}
                    onClose={() => setMenuState(null)}
                    navigate={navigate}
                />
            )}

            <CreateStoryModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSuccess={handleStoryCreated}
            />

            {viewerOpen && storiesGrouped.length > 0 && (
                <StoryViewer
                    storiesGrouped={storiesGrouped}
                    initialUserIndex={viewerStartIndex}
                    onClose={() => setViewerOpen(false)}
                />
            )}
        </>
    );
};

export default StoriesRow;
