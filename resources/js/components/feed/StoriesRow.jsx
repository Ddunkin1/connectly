import React from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../common/Avatar';
import { UilPlus } from '../common/Icons';
import useAuthStore from '../../store/authStore';

/* Story cards: 120x200px, gradient overlay, 36px avatar top-left with 3px purple ring, name bottom-left */

const STORY_PLACEHOLDERS = [
    { id: '1', name: 'Lilla James', color: '#EAB308' },
    { id: '2', name: 'Winnie Hale', color: '#EC4899' },
    { id: '3', name: 'Daniel Bale', color: '#3B82F6' },
    { id: '4', name: 'Jane Doe', color: '#EF4444' },
    { id: '5', name: 'Tina White', color: '#14B8A6' },
];

const StoriesRow = () => {
    const user = useAuthStore((s) => s.user);

    return (
        <div className="flex gap-3 overflow-x-auto pb-2 mb-6 scrollbar-hide -mx-1 px-1" style={{ padding: '24px 0' }}>
            {/* Your Story - avatar top-left with + badge */}
            {user && (
                <Link to="/home" className="story-card shrink-0" aria-label="Add your story">
                    <div className="w-full h-full bg-gradient-to-br from-[#2D2D44] to-[#1A1A2E] relative">
                        <div className="absolute top-2 left-2 w-9 h-9 rounded-full border-[3px] flex items-center justify-center overflow-hidden z-[2]" style={{ borderColor: 'var(--theme-accent)', background: 'white' }}>
                            <Avatar src={user.profile_picture} alt={user.name} className="!w-7 !h-7 object-cover" />
                            <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-[var(--theme-accent)] rounded-full border-2 border-[#1A1A1A] flex items-center justify-center text-white">
                                <UilPlus size={12} color="white" />
                            </span>
                        </div>
                    </div>
                    <span className="story-name-overlay">Your Story</span>
                </Link>
            )}

            {/* Other stories - gradient overlay, 36px avatar top-left with colored ring, name bottom-left */}
            {STORY_PLACEHOLDERS.map((story) => (
                <Link key={story.id} to="/home" className="story-card shrink-0" aria-label={`View ${story.name}'s story`}>
                    <div className="w-full h-full absolute inset-0" style={{ background: `linear-gradient(180deg, ${story.color}50 0%, #1A1A2E 70%)` }} />
                    <div className="story-gradient" />
                    <div className="absolute top-2 left-2 w-9 h-9 rounded-full border-[3px] flex items-center justify-center overflow-hidden z-[2] bg-white" style={{ borderColor: story.color }}>
                        <Avatar src={null} alt={story.name} className="!w-7 !h-7 object-cover" />
                    </div>
                    <span className="story-name-overlay">{story.name}</span>
                </Link>
            ))}
        </div>
    );
};

export default StoriesRow;
