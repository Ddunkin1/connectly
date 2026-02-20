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
            <div className="flex gap-3 overflow-x-auto pt-6 pb-4 scrollbar-hide h-[100px] items-end mt-2">
                <div className="flex items-center justify-center w-16 h-16 shrink-0">
                    <LoadingSpinner size="sm" />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex gap-3 overflow-x-auto pt-6 pb-4 scrollbar-hide h-[100px] items-end mt-2">
                {user && (
                    <button
                        type="button"
                        onClick={() => setCreateModalOpen(true)}
                        className="flex flex-col items-center space-y-2 flex-shrink-0 cursor-pointer group"
                        aria-label="Add your story"
                    >
                        <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center shrink-0 transition-all duration-200 group-hover:opacity-90 group-hover:scale-105">
                            <span className="material-symbols-outlined text-white text-2xl font-bold">add</span>
                        </div>
                        <span className="text-[11px] font-bold text-primary">Add story</span>
                    </button>
                )}

                {storiesGrouped.map((group, index) => {
                    const hasRing = group.has_unviewed;
                    return (
                        <button
                            key={group.user?.id}
                            type="button"
                            onClick={() => openViewer(index)}
                            className={`flex flex-col items-center space-y-2 flex-shrink-0 cursor-pointer ${!hasRing ? 'opacity-60' : ''}`}
                            aria-label={`View ${group.user?.name}'s story`}
                        >
                            {hasRing ? (
                                <div className="story-ring story-ring-thin rounded-xl shrink-0 inline-flex">
                                    <Avatar
                                        src={group.user?.profile_picture}
                                        alt={group.user?.name}
                                        className="w-16 h-16 rounded-[10px]"
                                    />
                                </div>
                            ) : (
                                <div className="rounded-xl shrink-0 overflow-hidden inline-flex">
                                    <Avatar
                                        src={group.user?.profile_picture}
                                        alt={group.user?.name}
                                        className="w-16 h-16 rounded-xl"
                                    />
                                </div>
                            )}
                            <span className="text-[11px] font-medium text-[var(--text-primary)] truncate max-w-[64px]">
                                {group.user?.name}
                            </span>
                        </button>
                    );
                })}
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
