import React, { useState, useEffect, useCallback } from 'react';
import Avatar from '../common/Avatar';

const STORY_DURATION_MS = 5000;

const StoryViewer = ({ storiesGrouped, initialUserIndex = 0, onClose }) => {
    const [userIndex, setUserIndex] = useState(initialUserIndex);
    const [storyIndex, setStoryIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    const group = storiesGrouped[userIndex];
    const stories = group?.stories ?? [];
    const currentStory = stories[storyIndex];

    const goNext = useCallback(() => {
        if (storyIndex < stories.length - 1) {
            setStoryIndex((i) => i + 1);
            setProgress(0);
        } else if (userIndex < storiesGrouped.length - 1) {
            setUserIndex((i) => i + 1);
            setStoryIndex(0);
            setProgress(0);
        } else {
            onClose();
        }
    }, [storyIndex, stories.length, userIndex, storiesGrouped.length, onClose]);

    const goPrev = useCallback(() => {
        if (storyIndex > 0) {
            setStoryIndex((i) => i - 1);
            setProgress(0);
        } else if (userIndex > 0) {
            const prevGroup = storiesGrouped[userIndex - 1];
            setUserIndex((i) => i - 1);
            setStoryIndex(prevGroup?.stories?.length ? prevGroup.stories.length - 1 : 0);
            setProgress(0);
        } else {
            onClose();
        }
    }, [storyIndex, userIndex, storiesGrouped, onClose]);

    // Progress bar timer
    useEffect(() => {
        if (!currentStory) return;
        const start = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - start;
            const p = Math.min(100, (elapsed / STORY_DURATION_MS) * 100);
            setProgress(p);
            if (p >= 100) {
                clearInterval(interval);
                goNext();
            }
        }, 50);
        return () => clearInterval(interval);
    }, [currentStory?.id, userIndex, storyIndex, goNext]);

    // Keyboard
    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') goNext();
            if (e.key === 'ArrowLeft') goPrev();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose, goNext, goPrev]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    if (!group || !currentStory) return null;

    const user = group.user;

    return (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center" onClick={goNext}>
            {/* Progress bars */}
            <div className="absolute top-0 left-0 right-0 flex gap-1 p-3 z-10">
                {stories.map((_, i) => (
                    <div
                        key={i}
                        className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
                    >
                        <div
                            className="h-full bg-white rounded-full transition-all duration-75"
                            style={{
                                width:
                                    i < storyIndex
                                        ? '100%'
                                        : i === storyIndex
                                        ? `${progress}%`
                                        : '0%',
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Header */}
            <div
                className="absolute top-0 left-0 right-0 flex items-center gap-3 p-4 pt-14 z-10"
                onClick={(e) => e.stopPropagation()}
            >
                <Avatar src={user?.profile_picture} alt={user?.name} size="sm" />
                <span className="text-white font-medium">{user?.name}</span>
                <span className="text-gray-400 text-sm">@{user?.username}</span>
            </div>

            {/* Media - click areas for prev/next */}
            <div className="absolute inset-0 flex">
                <div
                    className="flex-1 cursor-pointer"
                    onClick={(e) => {
                        e.stopPropagation();
                        goPrev();
                    }}
                    aria-label="Previous"
                />
                <div className="flex-[2] flex items-center justify-center min-w-0">
                    {currentStory.media_type === 'video' ? (
                        <video
                            src={currentStory.media_url}
                            autoPlay
                            playsInline
                            muted
                            loop={false}
                            className="max-h-full max-w-full object-contain"
                        />
                    ) : (
                        <img
                            src={currentStory.media_url}
                            alt="Story"
                            className="max-h-full max-w-full object-contain"
                        />
                    )}
                </div>
                <div
                    className="flex-1 cursor-pointer"
                    onClick={(e) => {
                        e.stopPropagation();
                        goNext();
                    }}
                    aria-label="Next"
                />
            </div>

            {/* Caption overlay - bottom with gradient for readability */}
            {currentStory.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-5 pb-12 pt-16 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                    <p className="text-white text-[15px] leading-relaxed font-medium drop-shadow-lg">{currentStory.caption}</p>
                </div>
            )}

            {/* Close button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 z-20"
                aria-label="Close"
            >
                <span className="material-symbols-outlined">close</span>
            </button>
        </div>
    );
};

export default StoryViewer;
