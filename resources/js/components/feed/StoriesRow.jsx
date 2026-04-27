import React, { useState } from 'react';
import useAuthStore from '../../store/authStore';
import { useStories } from '../../hooks/useStories';
import CreateStoryModal from './CreateStoryModal';
import StoryViewer from './StoryViewer';
import Avatar from '../common/Avatar';
import LoadingSpinner from '../common/LoadingSpinner';

const StoriesRow = () => {
    const user = useAuthStore((s) => s.user);
    const { data: storiesGrouped = [], isLoading, refetch } = useStories();
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerStartIndex, setViewerStartIndex] = useState(0);

    const openViewer = (userIndex) => {
        setViewerStartIndex(userIndex);
        setViewerOpen(true);
    };

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
                        return (
                            <button
                                key={group.user?.id}
                                type="button"
                                onClick={() => openViewer(index)}
                                className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
                                aria-label={`View ${group.user?.name}'s story`}
                            >
                                <div className="p-[2px] rounded-full"
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
