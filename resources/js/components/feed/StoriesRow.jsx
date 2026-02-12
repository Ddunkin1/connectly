import React from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

/* Stitch AI: Your Story = square dashed, others = story-ring gradient, older = opacity-50 */

const STORY_PLACEHOLDERS = [
    { id: '1', name: 'Lilla James', hasRing: true },
    { id: '2', name: 'Winnie Hale', hasRing: true },
    { id: '3', name: 'Daniel Bale', hasRing: true },
    { id: '4', name: 'Jane Doe', hasRing: false },
    { id: '5', name: 'Tina Turner', hasRing: false },
];

const StoriesRow = () => {
    const user = useAuthStore((s) => s.user);

    return (
        <div className="flex gap-3 overflow-x-auto pt-6 pb-4 scrollbar-hide h-[100px] items-end mt-2">
            {user && (
                <Link to="/home" className="flex flex-col items-center space-y-2 flex-shrink-0 cursor-pointer group" aria-label="Add your story">
                    <div className="w-16 h-16 rounded-xl bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center group-hover:border-primary transition-colors shrink-0">
                        <span className="material-symbols-outlined text-primary">add</span>
                    </div>
                    <span className="text-[11px] font-medium opacity-60">Your Story</span>
                </Link>
            )}

            {STORY_PLACEHOLDERS.map((story) => (
                <Link key={story.id} to="/home" className={`flex flex-col items-center space-y-2 flex-shrink-0 cursor-pointer ${!story.hasRing ? 'opacity-50' : ''}`} aria-label={`View ${story.name}'s story`}>
                    {story.hasRing ? (
                        <div className="story-ring rounded-xl p-[2px] shrink-0">
                            <img alt={story.name} className="w-16 h-16 rounded-xl object-cover border-2 border-[#121214]" src={`https://i.pravatar.cc/128?u=${story.id}`} />
                        </div>
                    ) : (
                        <div className="rounded-xl p-[2px] border border-slate-700 shrink-0">
                            <img alt={story.name} className="w-16 h-16 rounded-xl object-cover" src={`https://i.pravatar.cc/128?u=${story.id}`} />
                        </div>
                    )}
                    <span className="text-[11px] font-medium">{story.name}</span>
                </Link>
            ))}
        </div>
    );
};

export default StoriesRow;
