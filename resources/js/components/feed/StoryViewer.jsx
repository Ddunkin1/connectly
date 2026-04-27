import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Avatar from '../common/Avatar';
import { storiesAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';
import { useDeleteStory, useUpdateStory } from '../../hooks/useStories';
import toast from 'react-hot-toast';

const STORY_DURATION_MS = 5000;

const AUDIENCE_OPTIONS = [
    { value: 'public',  label: 'Everyone',     icon: 'public' },
    { value: 'friends', label: 'Friends only',  icon: 'group' },
    { value: 'private', label: 'Only me',       icon: 'lock' },
];

const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
};

const formatTimeLeft = (expiresAtStr) => {
    if (!expiresAtStr) return '';
    const msLeft = new Date(expiresAtStr).getTime() - Date.now();
    if (msLeft <= 0) return 'Expired';
    const totalMins = Math.floor(msLeft / 60000);
    if (totalMins < 60) return `${totalMins}m left`;
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return mins > 0 ? `${hours}h ${mins}m left` : `${hours}h left`;
};

const StoryViewer = ({ storiesGrouped, initialUserIndex = 0, onClose }) => {
    const queryClient = useQueryClient();
    const currentUser = useAuthStore((s) => s.user);
    const [userIndex, setUserIndex] = useState(initialUserIndex);
    const [storyIndex, setStoryIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [paused, setPaused] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [audiencePanel, setAudiencePanel] = useState(false);
    const pausedRef = useRef(false);
    const menuRef = useRef(null);

    const { mutate: deleteStory } = useDeleteStory();
    const { mutate: updateStory } = useUpdateStory();

    const group = storiesGrouped[userIndex];
    const stories = group?.stories ?? [];
    const currentStory = stories[storyIndex];
    const isOwn = group?.user?.id === currentUser?.id;

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
        }
    }, [storyIndex, userIndex, storiesGrouped]);

    // Record view
    useEffect(() => {
        if (!currentStory?.id || !currentUser || isOwn) return;
        storiesAPI.view(currentStory.id).then(() => {
            queryClient.invalidateQueries({ queryKey: ['stories'] });
        }).catch(() => {});
    }, [currentStory?.id, isOwn, currentUser?.id, queryClient]);

    // Progress timer
    useEffect(() => {
        if (!currentStory) return;
        pausedRef.current = false;
        setPaused(false);
        setProgress(0);
        const start = Date.now();
        let elapsed = 0;
        const interval = setInterval(() => {
            if (pausedRef.current) return;
            elapsed = Date.now() - start;
            const p = Math.min(100, (elapsed / STORY_DURATION_MS) * 100);
            setProgress(p);
            if (p >= 100) {
                clearInterval(interval);
                goNext();
            }
        }, 50);
        return () => clearInterval(interval);
    }, [currentStory?.id, userIndex, storyIndex]);

    const togglePause = (e) => {
        e.stopPropagation();
        pausedRef.current = !pausedRef.current;
        setPaused(pausedRef.current);
    };

    // Keyboard
    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'Escape') { if (menuOpen || audiencePanel) { setMenuOpen(false); setAudiencePanel(false); } else { onClose(); } }
            if (e.key === 'ArrowRight') goNext();
            if (e.key === 'ArrowLeft') goPrev();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose, goNext, goPrev, menuOpen, audiencePanel]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    // Close menu on outside click
    useEffect(() => {
        if (!menuOpen) return;
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [menuOpen]);

    // Pause when menu is open
    useEffect(() => {
        pausedRef.current = menuOpen || audiencePanel;
        setPaused(menuOpen || audiencePanel);
    }, [menuOpen, audiencePanel]);

    if (!group || !currentStory) return null;

    const storyUser = group.user;
    const prevGroup = storiesGrouped[userIndex - 1];
    const nextGroup = storiesGrouped[userIndex + 1];

    const handleDelete = () => {
        setMenuOpen(false);
        deleteStory(currentStory.id, {
            onSuccess: () => {
                if (stories.length > 1) {
                    if (storyIndex > 0) setStoryIndex((i) => i - 1);
                } else if (storiesGrouped.length > 1) {
                    goNext();
                } else {
                    onClose();
                }
            },
        });
    };

    const handleArchive = () => {
        setMenuOpen(false);
        updateStory({ storyId: currentStory.id, data: { is_archived: true } }, {
            onSuccess: () => {
                if (stories.length > 1) {
                    if (storyIndex > 0) setStoryIndex((i) => i - 1);
                } else if (storiesGrouped.length > 1) {
                    goNext();
                } else {
                    onClose();
                }
            },
        });
    };

    const handleAudience = (value) => {
        updateStory({ storyId: currentStory.id, data: { visibility: value } });
        setAudiencePanel(false);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center">
            {/* Backdrop close */}
            <div className="absolute inset-0" onClick={onClose} />

            {/* Prev user preview */}
            {prevGroup && (
                <button
                    onClick={(e) => { e.stopPropagation(); setUserIndex((i) => i - 1); setStoryIndex(0); setProgress(0); }}
                    className="absolute left-4 xl:left-16 z-10 hidden sm:flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity"
                    aria-label="Previous user"
                >
                    <div className="w-12 h-12 rounded-full ring-2 ring-white/40 overflow-hidden">
                        <Avatar src={prevGroup.user?.profile_picture} alt={prevGroup.user?.name} className="w-12 h-12" />
                    </div>
                    <span className="text-white text-xs font-medium max-w-[60px] truncate">{prevGroup.user?.name}</span>
                </button>
            )}

            {/* Story card */}
            <div
                className="relative z-10 bg-black rounded-xl overflow-hidden shadow-2xl"
                style={{ width: 'min(400px, 100vw)', height: 'min(710px, 100svh)', maxHeight: '100svh' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Progress bars */}
                <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-20">
                    {stories.map((_, i) => (
                        <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white rounded-full"
                                style={{
                                    width: i < storyIndex ? '100%' : i === storyIndex ? `${progress}%` : '0%',
                                    transition: i === storyIndex ? 'none' : undefined,
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Header */}
                <div className="absolute top-0 left-0 right-0 flex items-center gap-2.5 px-3 pt-6 pb-3 z-20"
                    style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)' }}
                >
                    <Avatar src={storyUser?.profile_picture} alt={storyUser?.name} size="sm" className="ring-2 ring-white/70 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold leading-tight truncate">{storyUser?.name}</p>
                        <p className="text-white/60 text-xs">
                            {formatTimeAgo(currentStory.created_at)}
                            {currentStory.expires_at && !currentStory.is_archived && (
                                <span className="ml-1.5 opacity-70">· {formatTimeLeft(currentStory.expires_at)}</span>
                            )}
                        </p>
                    </div>

                    {/* Pause/play */}
                    <button onClick={togglePause} className="p-1.5 text-white/80 hover:text-white" aria-label={paused ? 'Play' : 'Pause'}>
                        <span className="material-symbols-outlined text-xl">{paused ? 'play_arrow' : 'pause'}</span>
                    </button>

                    {/* 3-dot menu — own stories only */}
                    {isOwn && (
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); setAudiencePanel(false); }}
                                className="p-1.5 text-white/80 hover:text-white"
                                aria-label="Story options"
                            >
                                <span className="material-symbols-outlined text-xl">more_vert</span>
                            </button>

                            {menuOpen && !audiencePanel && (
                                <div className="absolute right-0 top-8 w-52 bg-[#1c1c1e] rounded-xl shadow-2xl overflow-hidden z-30 border border-white/10">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setAudiencePanel(true); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-white text-sm hover:bg-white/10 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-lg text-blue-400">tune</span>
                                        Change audience
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleArchive(); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-white text-sm hover:bg-white/10 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-lg text-yellow-400">inventory_2</span>
                                        Archive story
                                    </button>
                                    <div className="border-t border-white/10" />
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-red-400 text-sm hover:bg-white/10 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                        Delete story
                                    </button>
                                </div>
                            )}

                            {/* Audience sub-panel */}
                            {menuOpen && audiencePanel && (
                                <div className="absolute right-0 top-8 w-52 bg-[#1c1c1e] rounded-xl shadow-2xl overflow-hidden z-30 border border-white/10">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setAudiencePanel(false); }}
                                        className="w-full flex items-center gap-2 px-4 py-3 text-white/60 text-sm hover:bg-white/10 border-b border-white/10"
                                    >
                                        <span className="material-symbols-outlined text-base">arrow_back</span>
                                        Audience
                                    </button>
                                    {AUDIENCE_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={(e) => { e.stopPropagation(); handleAudience(opt.value); }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/10 transition-colors ${
                                                currentStory.visibility === opt.value ? 'text-blue-400' : 'text-white'
                                            }`}
                                        >
                                            <span className="material-symbols-outlined text-lg">{opt.icon}</span>
                                            {opt.label}
                                            {currentStory.visibility === opt.value && (
                                                <span className="material-symbols-outlined text-base ml-auto">check</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Close */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="p-1.5 text-white/80 hover:text-white"
                        aria-label="Close"
                    >
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                {/* Media */}
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                    {currentStory.media_type === 'video' ? (
                        <video
                            key={currentStory.id}
                            src={currentStory.media_url}
                            autoPlay
                            playsInline
                            muted
                            loop={false}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <img
                            key={currentStory.id}
                            src={currentStory.media_url}
                            alt="Story"
                            className="w-full h-full object-cover"
                        />
                    )}
                </div>

                {/* Caption */}
                {currentStory.caption && (
                    <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 pt-16 z-10"
                        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)' }}
                    >
                        <p className="text-white text-sm leading-relaxed font-medium">{currentStory.caption}</p>
                    </div>
                )}

                {/* Tap zones */}
                <div className="absolute inset-0 flex z-10">
                    <div className="flex-1" onClick={goPrev} aria-label="Previous" />
                    <div className="flex-1" onClick={goNext} aria-label="Next" />
                </div>
            </div>

            {/* Next user preview */}
            {nextGroup && (
                <button
                    onClick={(e) => { e.stopPropagation(); setUserIndex((i) => i + 1); setStoryIndex(0); setProgress(0); }}
                    className="absolute right-4 xl:right-16 z-10 hidden sm:flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity"
                    aria-label="Next user"
                >
                    <div className="w-12 h-12 rounded-full ring-2 ring-white/40 overflow-hidden">
                        <Avatar src={nextGroup.user?.profile_picture} alt={nextGroup.user?.name} className="w-12 h-12" />
                    </div>
                    <span className="text-white text-xs font-medium max-w-[60px] truncate">{nextGroup.user?.name}</span>
                </button>
            )}

            {/* Left/right nav arrows (desktop) */}
            {(userIndex > 0 || storyIndex > 0) && (
                <button
                    onClick={(e) => { e.stopPropagation(); goPrev(); }}
                    className="absolute left-1/2 z-10 hidden sm:flex -translate-x-[calc(200px+32px)] items-center justify-center w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
                    aria-label="Previous"
                >
                    <span className="material-symbols-outlined">chevron_left</span>
                </button>
            )}
            {(userIndex < storiesGrouped.length - 1 || storyIndex < stories.length - 1) && (
                <button
                    onClick={(e) => { e.stopPropagation(); goNext(); }}
                    className="absolute left-1/2 z-10 hidden sm:flex translate-x-[calc(200px+8px)] items-center justify-center w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
                    aria-label="Next"
                >
                    <span className="material-symbols-outlined">chevron_right</span>
                </button>
            )}
        </div>
    );
};

export default StoryViewer;
