import React from 'react';
import { Link } from 'react-router-dom';
import { useOnboarding } from '../../hooks/useOnboarding';
import useAuthStore from '../../store/authStore';

const OnboardingChecklistCard = () => {
    const currentUser = useAuthStore((state) => state.user);
    const {
        hasProfileBasics,
        hasConnections,
        hasJoinedCommunity,
        followingCount,
        joinedCommunities,
        progress,
        isComplete,
    } = useOnboarding();

    const [dismissed, setDismissed] = React.useState(
        () => localStorage.getItem('connectly_checklist_dismissed') === 'true'
    );

    if (isComplete) {
        return null;
    }

    if (dismissed) return null;

    const handleDismiss = () => {
        localStorage.setItem('connectly_checklist_dismissed', 'true');
        setDismissed(true);
    };

    return (
        <div className="mb-6 theme-surface rounded-xl p-6 border border-white/5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)] font-semibold">
                        Getting started
                    </p>
                    <h2 className="text-sm md:text-base font-semibold text-[var(--text-primary)]">
                        Complete your setup to personalize Connectly
                    </h2>
                </div>
                <div className="flex items-center gap-2.5">
                    <span className="text-xs text-[var(--text-secondary)]">{progress}%</span>
                    <div className="w-28 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleDismiss}
                        className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors whitespace-nowrap ml-4"
                        title="Dismiss"
                    >
                        Skip
                    </button>
                </div>
            </div>
            <ul className="space-y-3 text-xs md:text-sm text-[var(--text-primary)]">
                <li className="flex items-start gap-3">
                    <span className={`material-symbols-outlined text-[18px] mt-[1px] shrink-0 ${hasProfileBasics ? 'text-[var(--theme-accent)]' : 'text-[var(--text-secondary)]'}`}>
                        {hasProfileBasics ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <span>
                        <span className="font-medium">Complete your profile</span>{' '}
                        <span className="text-[var(--text-secondary)]">Add a photo and bio.</span>{' '}
                        <Link to={currentUser?.username ? `/profile/${currentUser.username}?edit=1` : '/edit-profile'} className="text-primary hover:underline">
                            Edit profile
                        </Link>
                    </span>
                </li>
                <li className="flex items-start gap-3">
                    <span className={`material-symbols-outlined text-[18px] mt-[1px] shrink-0 ${hasConnections ? 'text-[var(--theme-accent)]' : 'text-[var(--text-secondary)]'}`}>
                        {hasConnections ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <span>
                        <span className="font-medium">Follow at least 3 people</span>{' '}
                        <span className="text-[var(--text-secondary)]">
                            {hasConnections ? 'Done.' : `${followingCount}/3 so far.`}
                        </span>{' '}
                        <Link to="/search" className="text-primary hover:underline">
                            Find people
                        </Link>
                    </span>
                </li>
                <li className="flex items-start gap-3">
                    <span className={`material-symbols-outlined text-[18px] mt-[1px] shrink-0 ${hasJoinedCommunity ? 'text-[var(--theme-accent)]' : 'text-[var(--text-secondary)]'}`}>
                        {hasJoinedCommunity ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <span>
                        <span className="font-medium">Join a community</span>{' '}
                        <span className="text-[var(--text-secondary)]">
                            {hasJoinedCommunity
                                ? `${joinedCommunities.length} joined.`
                                : 'Discover spaces that match your interests.'}
                        </span>{' '}
                        <Link to="/communities" className="text-primary hover:underline">
                            Browse communities
                        </Link>
                    </span>
                </li>
            </ul>
            <div className="mt-3 text-right">
                <Link
                    to="/onboarding"
                    className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                    Open full checklist
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                </Link>
            </div>
        </div>
    );
};

export default OnboardingChecklistCard;
