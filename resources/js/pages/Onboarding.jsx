import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useOnboarding } from '../hooks/useOnboarding';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useFollow } from '../hooks/useUsers';
import { useJoinCommunity } from '../hooks/useCommunities';

const Onboarding = () => {
    const navigate = useNavigate();
    const {
        user,
        suggestedUsers,
        suggestedUsersLoading,
        communitiesData,
        communitiesLoading,
        joinedCommunities,
        hasProfileBasics,
        hasConnections,
        hasJoinedCommunity,
        followingCount,
        progress,
        isComplete,
    } = useOnboarding();

    const followMutation = useFollow();
    const joinCommunityMutation = useJoinCommunity();

    const suggestedCommunities =
        communitiesData?.communities?.filter((community) => community.is_member === false) ?? [];

    const handleSkip = () => {
        navigate('/home', { replace: true });
    };

    const handleContinue = () => {
        navigate('/home', { replace: true });
    };

    if (!user) {
        return (
            <div className="max-w-3xl mx-auto py-12">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Welcome to Connectly, {user.name}!</h1>
                    <p className="text-sm text-slate-400">
                        Complete a few quick steps to personalize your experience.
                    </p>
                </div>
                <button
                    type="button"
                    className="text-xs md:text-sm text-slate-400 hover:text-slate-200 underline"
                    onClick={handleSkip}
                >
                    Skip for now
                </button>
            </div>

            <div className="glass-effect rounded-2xl p-4 md:p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">
                            Onboarding progress
                        </p>
                        <p className="text-sm text-slate-300">
                            {isComplete ? 'All steps completed' : 'Finish these steps to get the most out of Connectly.'}
                        </p>
                    </div>
                    <span className="text-lg font-semibold text-white">{progress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <div className="space-y-6">
                {/* Step 1: Complete profile */}
                <section className="theme-surface rounded-2xl border border-white/5 p-4 md:p-6">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="shrink-0">
                            <Avatar
                                src={user.profile_picture}
                                alt={user.name}
                                size="lg"
                                className="w-14 h-14 rounded-full object-cover"
                            />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-base md:text-lg font-semibold text-white">
                                        Step 1 · Complete your profile
                                    </h2>
                                    <p className="text-xs md:text-sm text-slate-400 mt-1">
                                        Add a profile photo and bio so people recognize you.
                                    </p>
                                </div>
                                <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                        hasProfileBasics
                                            ? 'bg-emerald-500/10 text-emerald-400'
                                            : 'bg-slate-700/60 text-slate-300'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[14px] mr-1">
                                        {hasProfileBasics ? 'check_circle' : 'radio_button_unchecked'}
                                    </span>
                                    {hasProfileBasics ? 'Done' : 'To do'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-xs md:text-sm text-slate-400">
                            <span className="font-semibold text-slate-200">Tip:</span> You can always change these later in
                            your profile settings.
                        </div>
                        <Link
                            to={user?.username ? `/profile/${user.username}?edit=1` : '/edit-profile'}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-white/10 text-xs md:text-sm text-slate-200 hover:bg-white/5"
                        >
                            <span className="material-symbols-outlined text-sm">edit</span>
                            Edit profile
                        </Link>
                    </div>
                </section>

                {/* Step 2: Follow people */}
                <section className="theme-surface rounded-2xl border border-white/5 p-4 md:p-6">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h2 className="text-base md:text-lg font-semibold text-white">
                                Step 2 · Follow a few people
                            </h2>
                            <p className="text-xs md:text-sm text-slate-400 mt-1">
                                Follow creators you like to see their posts in your feed.
                            </p>
                        </div>
                        <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                hasConnections ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700/60 text-slate-300'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[14px] mr-1">
                                {hasConnections ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                            {hasConnections ? 'Done' : `${followingCount}/3 followed`}
                        </span>
                    </div>

                    {suggestedUsersLoading ? (
                        <div className="flex justify-center py-4">
                            <LoadingSpinner size="sm" />
                        </div>
                    ) : suggestedUsers.length === 0 ? (
                        <p className="text-xs text-slate-500">
                            You&apos;re already connected with people. Explore more in{' '}
                            <Link to="/search" className="text-primary hover:underline">
                                Search
                            </Link>
                            .
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            {suggestedUsers.slice(0, 4).map((suggested) => {
                                const isFollowing = suggested.is_following;
                                const isPending = followMutation.isPending && followMutation.variables === suggested.id;
                                return (
                                    <div
                                        key={suggested.id}
                                        className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5"
                                    >
                                        <Avatar
                                            src={suggested.profile_picture}
                                            alt={suggested.name}
                                            size="md"
                                            className="w-10 h-10 rounded-full"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">{suggested.name}</p>
                                            <p className="text-xs text-slate-500 truncate">@{suggested.username}</p>
                                        </div>
                                        <Button
                                            size="xs"
                                            variant={isFollowing ? 'outline' : 'primary'}
                                            disabled={isPending || isFollowing}
                                            loading={isPending}
                                            onClick={() => followMutation.mutate(suggested.id)}
                                        >
                                            {isFollowing ? 'Following' : 'Connect'}
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="flex items-center justify-between text-xs md:text-sm text-slate-400">
                        <span>
                            Looking for someone specific?{' '}
                            <Link to="/search" className="text-primary hover:underline">
                                Search by name or username
                            </Link>
                            .
                        </span>
                    </div>
                </section>

                {/* Step 3: Join communities */}
                <section className="theme-surface rounded-2xl border border-white/5 p-4 md:p-6">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h2 className="text-base md:text-lg font-semibold text-white">
                                Step 3 · Join a community
                            </h2>
                            <p className="text-xs md:text-sm text-slate-400 mt-1">
                                Communities are shared spaces for people with similar interests.
                            </p>
                        </div>
                        <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                hasJoinedCommunity
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-slate-700/60 text-slate-300'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[14px] mr-1">
                                {hasJoinedCommunity ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                            {hasJoinedCommunity
                                ? `${joinedCommunities.length} joined`
                                : 'Join at least 1'}
                        </span>
                    </div>

                    {communitiesLoading ? (
                        <div className="flex justify-center py-4">
                            <LoadingSpinner size="sm" />
                        </div>
                    ) : suggestedCommunities.length === 0 ? (
                        <p className="text-xs text-slate-500">
                            You&apos;re already in communities. Manage them on the{' '}
                            <Link to="/communities" className="text-primary hover:underline">
                                Communities
                            </Link>{' '}
                            page.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            {suggestedCommunities.slice(0, 4).map((community) => {
                                const isJoining =
                                    joinCommunityMutation.isPending &&
                                    joinCommunityMutation.variables === community.id;
                                return (
                                    <div
                                        key={community.id}
                                        className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-2"
                                    >
                                        <div className="flex items-start gap-3">
                                            <Avatar
                                                src={community.avatar}
                                                alt={community.name}
                                                size="md"
                                                className="w-10 h-10 rounded-lg"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-white truncate">
                                                    {community.name}
                                                </p>
                                                <p className="text-xs text-slate-500 line-clamp-2">
                                                    {community.description || 'No description'}
                                                </p>
                                                <p className="text-[10px] text-slate-500 mt-1">
                                                    {community.members_count || 0} members
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <Link
                                                to={`/communities/${community.id}`}
                                                className="text-[11px] text-slate-400 hover:text-slate-200 underline"
                                            >
                                                View
                                            </Link>
                                            <Button
                                                size="xs"
                                                variant="outline"
                                                disabled={isJoining}
                                                loading={isJoining}
                                                onClick={() => joinCommunityMutation.mutate(community.id)}
                                            >
                                                {isJoining ? 'Joining...' : 'Join'}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>

            <div className="flex justify-end mt-8">
                <Button
                    variant="primary"
                    size="md"
                    onClick={handleContinue}
                >
                    {isComplete ? 'Go to Home' : 'Continue to Home'}
                </Button>
            </div>
        </div>
    );
};

export default Onboarding;

