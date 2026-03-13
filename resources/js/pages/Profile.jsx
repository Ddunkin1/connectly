import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useUserProfile, useUserPosts, useFollow, useUnfollow } from '../hooks/useUsers';
import { useFriendRequests, useAcceptFriendRequest, useRejectFriendRequest, useCancelFriendRequest } from '../hooks/useFriendRequests';
import { useBlockUser } from '../hooks/useBlocks';
import ReportModal from '../components/common/ReportModal';
import EditProfileModal from '../components/profile/EditProfileModal';
import useAuthStore from '../store/authStore';
import Avatar from '../components/common/Avatar';
import PostCard from '../components/posts/PostCard';
import PostInput from '../components/posts/PostInput';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatDate } from '../utils/formatDate';
import { useStories } from '../hooks/useStories';

const COVER_GRADIENT = 'linear-gradient(135deg, #4b5563 0%, #374151 50%, #1f2937 100%)';

/** Resolve cover URL: when API returns relative path and VITE_API_URL is set (production), prepend API base */
function resolveCoverUrl(url) {
    if (!url || !url.startsWith('/')) return url;
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) return url; // Local dev: relative path resolves via proxy
    const base = apiUrl.replace(/\/api\/?$/, '');
    return base ? `${base}${url}` : url;
}

const Profile = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const currentUser = useAuthStore((state) => state.user);
    const [activeTab, setActiveTab] = useState('posts');
    const [showBlockMenu, setShowBlockMenu] = useState(false);
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const [coverImageFailed, setCoverImageFailed] = useState(false);
    
    const { data: profile, isLoading: profileLoading } = useUserProfile(username);
    const { data: storiesGrouped = [] } = useStories();
    const blockMutation = useBlockUser();
    const { data: postsData, isLoading: postsLoading, refetch: refetchPosts } = useUserPosts(username);
    const { data: friendRequestsData } = useFriendRequests();
    const followMutation = useFollow();
    const unfollowMutation = useUnfollow();
    const acceptFriendRequestMutation = useAcceptFriendRequest();
    const rejectFriendRequestMutation = useRejectFriendRequest();
    const cancelFriendRequestMutation = useCancelFriendRequest();

    const isOwnProfile = currentUser?.username === username;
    const hasActiveStory = profile
        ? storiesGrouped.some(
              (group) => group.user?.id === profile.id && (group.stories?.length > 0 || group.has_unviewed)
          )
        : false;
    const isFollowing = profile?.is_following;
    const friendRequestStatus = profile?.friend_request_status; // 'sent', 'received', or null
    const posts = postsData?.posts || [];

    // Find the friend request if current user received one from this profile
    const receivedRequest = friendRequestsData?.received?.find(
        req => req.sender?.id === profile?.id
    );
    // Find the friend request if current user sent one to this profile (for cancel)
    const sentRequest = friendRequestsData?.sent?.find(
        req => req.receiver?.id === profile?.id
    );

    useEffect(() => {
        if (isOwnProfile && searchParams.get('edit') === '1') {
            setEditModalOpen(true);
            setSearchParams({}, { replace: true });
        }
    }, [isOwnProfile, searchParams, setSearchParams]);

    // Reset cover error state when profile/cover changes
    useEffect(() => {
        setCoverImageFailed(false);
    }, [profile?.id, profile?.cover_image]);

    if (profileLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="text-center py-12 theme-bg-main">
                <p className="text-gray-400">User not found</p>
            </div>
        );
    }

    const formatJoinDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const month = date.toLocaleString('default', { month: 'long' });
        const year = date.getFullYear();
        return `Joined ${month} ${year}`;
    };

    const followersPreview = profile.followers_preview ?? [];
    const extraCount = Math.max(0, (profile.followers_count ?? 0) - followersPreview.length);

    return (
        <div className="max-w-[1400px] mx-auto">
            {/* Profile Banner Section */}
            <div className="theme-surface rounded-2xl overflow-hidden mb-6 border border-[#2A2A2A] card-shadow relative">
                {/* Cover Image - img with onError fallback to detect 403/404/502 */}
                <div 
                    className="h-64 relative overflow-hidden"
                    style={{
                        background: COVER_GRADIENT,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    {profile.cover_image && !coverImageFailed && (
                        <img
                            src={resolveCoverUrl(profile.cover_image)}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={() => setCoverImageFailed(true)}
                        />
                    )}
                    {/* Subtle noise overlay when using default gradient */}
                    {(!profile.cover_image || coverImageFailed) && (
                        <div 
                            className="absolute inset-0 opacity-[0.03] pointer-events-none"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                            }}
                        />
                    )}
                </div>

                {/* Profile Picture - Outside cover so it isn't clipped, overlaps cover/profile-info boundary */}
                <div className="absolute top-44 left-6 md:left-10 z-20">
                    <div className="relative drop-shadow-lg">
                        {hasActiveStory ? (
                            <div className="story-ring story-ring-thin rounded-full inline-flex">
                                <div className="w-40 h-40 rounded-full border-4 border-[var(--theme-surface)] p-1 theme-surface bg-[var(--theme-surface)] overflow-hidden">
                                    <Avatar
                                        src={profile.profile_picture}
                                        alt={profile.name}
                                        size="2xl"
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="w-40 h-40 rounded-full border-4 border-[var(--theme-border)] p-1 theme-surface bg-[var(--theme-surface)] overflow-hidden shadow-inner">
                                <Avatar
                                    src={profile.profile_picture}
                                    alt={profile.name}
                                    size="2xl"
                                    className="w-full h-full rounded-full object-cover"
                                />
                            </div>
                        )}
                        <span
                            className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[var(--theme-surface)] ring-2 ring-[var(--theme-surface)]"
                            title="Online"
                            aria-hidden
                        />
                    </div>
                </div>

                {/* Profile Info Section - extra top padding so name clears avatar */}
                <div className="pt-20 md:pt-24 pb-8 px-6 md:px-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">{profile.name}</h1>
                            {profile.username && (
                                <p className="text-gray-400 text-base mb-2">@{profile.username}</p>
                            )}
                            {profile.bio && profile.bio.trim().length >= 15 ? (
                                <p className="text-gray-400 mb-3 leading-relaxed">{profile.bio}</p>
                            ) : isOwnProfile ? (
                                <button
                                    type="button"
                                    onClick={() => setEditModalOpen(true)}
                                    className="text-slate-500 italic mb-3 inline-block hover:text-[var(--theme-accent)] transition-colors text-left"
                                >
                                    Add a bio to tell people about yourself
                                </button>
                            ) : null}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                                {profile.location && (
                                    <div className="flex items-center space-x-1">
                                        <span className="material-symbols-outlined text-base">location_on</span>
                                        <span>{profile.location}</span>
                                    </div>
                                )}
                                <div className="flex items-center space-x-1">
                                    <span className="material-symbols-outlined text-base">calendar_today</span>
                                    <span>{formatJoinDate(profile.created_at)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 mt-4 md:mt-0">
                            {isOwnProfile ? (
                                <button
                                    type="button"
                                    onClick={() => setEditModalOpen(true)}
                                    className="px-6 py-2 border border-[#374151] rounded-xl hover:bg-white/5 font-medium text-white transition-all active:scale-[0.98]"
                                >
                                    Edit Profile
                                </button>
                            ) : (
                                <>
                                    {friendRequestStatus === 'sent' ? (
                                        <div className="flex items-center gap-2">
                                            <span className="px-6 py-2 bg-white/10 text-gray-400 rounded-xl font-medium flex items-center space-x-2">
                                                <span className="material-symbols-outlined text-lg">hourglass_empty</span>
                                                <span>Request Sent</span>
                                            </span>
                                            <button
                                                onClick={() => cancelFriendRequestMutation.mutate(sentRequest?.id)}
                                                disabled={cancelFriendRequestMutation.isPending || !sentRequest?.id || String(sentRequest?.id).startsWith('temp-')}
                                                className="px-6 py-2 border border-[#374151] text-white rounded-xl font-medium transition-all hover:bg-white/5 active:scale-[0.98] flex items-center space-x-2 cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-lg">close</span>
                                                <span>Cancel request</span>
                                            </button>
                                        </div>
                                    ) : friendRequestStatus === 'received' ? (
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => acceptFriendRequestMutation.mutate(receivedRequest?.id)}
                                                disabled={acceptFriendRequestMutation.isPending}
                                                className="px-6 py-2 bg-[var(--theme-accent)] text-white rounded-xl font-medium transition-all hover:opacity-90 active:scale-[0.98] flex items-center space-x-2"
                                            >
                                                <span className="material-symbols-outlined text-lg">check</span>
                                                <span>Accept</span>
                                            </button>
                                            <button
                                                onClick={() => rejectFriendRequestMutation.mutate(receivedRequest?.id)}
                                                disabled={rejectFriendRequestMutation.isPending}
                                                className="px-6 py-2 bg-white/10 text-gray-400 rounded-xl font-medium transition-all hover:bg-white/20 active:scale-[0.98] flex items-center space-x-2"
                                            >
                                                <span className="material-symbols-outlined text-lg">close</span>
                                                <span>Reject</span>
                                            </button>
                                        </div>
                                    ) : isFollowing ? (
                                        <div className="flex items-center gap-2">
                                            <span className="px-6 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl font-medium flex items-center space-x-2">
                                                <span className="material-symbols-outlined text-lg">check_circle</span>
                                                <span>Connected</span>
                                            </span>
                                            <button
                                                onClick={() => unfollowMutation.mutate(profile.id)}
                                                disabled={unfollowMutation.isPending}
                                                className="px-6 py-2 bg-white/10 text-gray-400 rounded-xl font-medium transition-colors hover:bg-white/20 flex items-center space-x-2 cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-lg">person_remove</span>
                                                <span>Unfollow</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => followMutation.mutate(profile.id)}
                                            disabled={followMutation.isPending}
                                            className="px-6 py-2 bg-[var(--theme-accent)] text-white rounded-xl font-medium transition-all hover:opacity-90 active:scale-[0.98] flex items-center space-x-2 cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-lg">person_add</span>
                                            <span>Connect</span>
                                        </button>
                                    )}
                                    <Link
                                        to={`/messages/${username}`}
                                        className="px-6 py-2 border border-[#374151] rounded-xl hover:bg-white/5 font-medium text-white transition-all active:scale-[0.98] flex items-center space-x-2"
                                    >
                                        <span className="material-symbols-outlined text-lg">mail</span>
                                        <span>Message</span>
                                    </Link>
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowBlockMenu(!showBlockMenu)}
                                            className="p-2 border border-[#374151] rounded-xl hover:bg-white/5 text-gray-400"
                                            aria-label="More options"
                                        >
                                            <span className="material-symbols-outlined text-lg">more_horiz</span>
                                        </button>
                                        {showBlockMenu && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-10"
                                                    onClick={() => setShowBlockMenu(false)}
                                                    aria-hidden="true"
                                                />
                                                <div className="absolute right-0 mt-1 w-48 theme-surface border border-[#2A2A2A] rounded-xl shadow-lg py-1 z-20">
                                                    <button
                                                        onClick={() => {
                                                            setShowBlockMenu(false);
                                                            setReportModalOpen(true);
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-gray-300 hover:bg-white/5 flex items-center space-x-2 rounded-lg mx-1"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">flag</span>
                                                        <span>Report user</span>
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm('Block this user? They will no longer be able to see your profile, message you, or see your posts.')) {
                                                                blockMutation.mutate(profile.id, {
                                                                    onSuccess: () => {
                                                                        setShowBlockMenu(false);
                                                                        navigate('/');
                                                                    },
                                                                });
                                                            }
                                                        }}
                                                        disabled={blockMutation.isPending}
                                                        className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/10 flex items-center space-x-2 rounded-lg mx-1"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">block</span>
                                                        <span>Block user</span>
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {profile && !isOwnProfile && (
                    <ReportModal
                        isOpen={reportModalOpen}
                        onClose={() => setReportModalOpen(false)}
                        reportableType="user"
                        reportableId={profile.id}
                        title="Report user"
                    />
                )}

                {isOwnProfile && (
                    <EditProfileModal
                        isOpen={editModalOpen}
                        onClose={() => setEditModalOpen(false)}
                    />
                )}

                {/* Profile Navigation Tabs */}
                <div className="border-t border-[#2A2A2A] px-8">
                    <div className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab('posts')}
                            className={`py-4 font-medium border-b-2 transition-all duration-200 ${
                                activeTab === 'posts'
                                    ? 'text-[var(--theme-accent)] border-[var(--theme-accent)]'
                                    : 'text-gray-400 border-transparent hover:text-white'
                            }`}
                        >
                            Posts
                        </button>
                        <button
                            onClick={() => setActiveTab('media')}
                            className={`py-4 font-medium border-b-2 transition-all duration-200 ${
                                activeTab === 'media'
                                    ? 'text-[var(--theme-accent)] border-[var(--theme-accent)]'
                                    : 'text-gray-400 border-transparent hover:text-white'
                            }`}
                        >
                            Media
                        </button>
                        <button
                            onClick={() => setActiveTab('communities')}
                            className={`py-4 font-medium border-b-2 transition-all duration-200 ${
                                activeTab === 'communities'
                                    ? 'text-[var(--theme-accent)] border-[var(--theme-accent)]'
                                    : 'text-gray-400 border-transparent hover:text-white'
                            }`}
                        >
                            Communities
                        </button>
                        <button
                            onClick={() => setActiveTab('more')}
                            className={`py-4 font-medium border-b-2 transition-all duration-200 ${
                                activeTab === 'more'
                                    ? 'text-[var(--theme-accent)] border-[var(--theme-accent)]'
                                    : 'text-gray-400 border-transparent hover:text-white'
                            }`}
                        >
                            More
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Sidebar - About card */}
                {(profile.website || profile.location) && (
                <div className="lg:w-1/4 space-y-6">
                    {/* About Section - only website/location (bio is in header) */}
                    <div className="theme-surface rounded-2xl border border-[#2A2A2A] p-4 card-shadow transition-all duration-200 hover:shadow-lg hover:shadow-black/10">
                        <h2 className="text-lg font-bold text-white mb-3">About</h2>
                        <div className="space-y-3">
                            {profile.website && (
                                <div className="flex items-start space-x-2">
                                    <span className="material-symbols-outlined text-gray-500 text-sm mt-0.5 shrink-0">link</span>
                                    <a
                                        href={profile.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-[var(--theme-accent)] hover:underline break-all"
                                    >
                                        {profile.website}
                                    </a>
                                </div>
                            )}
                            {profile.location && (
                                <div className="flex items-start space-x-2">
                                    <span className="material-symbols-outlined text-gray-500 text-sm mt-0.5 shrink-0">work</span>
                                    <span className="text-sm text-gray-400">{profile.location}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                )}

                {/* Main Content - Posts Feed */}
                <div className={`${profile.website || profile.location ? 'lg:w-3/4 min-w-0' : 'w-full'} space-y-6`}>
                    {/* Post Input - Only show if viewing own profile */}
                    {isOwnProfile && (
                        <div className="theme-surface rounded-2xl border border-[#2A2A2A] p-6 card-shadow transition-all duration-200 hover:shadow-lg hover:shadow-black/10">
                            <PostInput onPostCreated={refetchPosts} />
                        </div>
                    )}

                    {/* Posts Feed */}
                    {postsLoading ? (
                        <div className="flex justify-center py-12">
                            <LoadingSpinner />
                        </div>
                    ) : posts.length > 0 ? (
                        <div className="space-y-6">
                            {posts.map((post) => (
                                <PostCard key={post.id} post={post} />
                            ))}
                        </div>
                    ) : (
                        <div className="theme-surface rounded-2xl border border-primary/20 p-12 text-center card-shadow">
                            {isOwnProfile ? (
                                <>
                                    <span className="material-symbols-outlined text-4xl text-primary/60 mb-3 block">edit_note</span>
                                    <p className="text-white font-medium mb-1">Share your first post!</p>
                                    <p className="text-slate-500 text-sm mb-4">Your story starts here. Click above to create a post.</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-gray-500">No posts yet</p>
                                    <p className="text-slate-600 text-sm mt-1">Check back later</p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
