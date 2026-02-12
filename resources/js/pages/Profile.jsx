import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useUserProfile, useUserPosts, useFollow, useUnfollow } from '../hooks/useUsers';
import { useFriendRequests, useAcceptFriendRequest, useRejectFriendRequest, useCancelFriendRequest } from '../hooks/useFriendRequests';
import { useBlockUser } from '../hooks/useBlocks';
import ReportModal from '../components/common/ReportModal';
import useAuthStore from '../store/authStore';
import Avatar from '../components/common/Avatar';
import PostCard from '../components/posts/PostCard';
import PostInput from '../components/posts/PostInput';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatDate } from '../utils/formatDate';

const Profile = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const currentUser = useAuthStore((state) => state.user);
    const [activeTab, setActiveTab] = useState('posts');
    const [showBlockMenu, setShowBlockMenu] = useState(false);
    const [reportModalOpen, setReportModalOpen] = useState(false);
    
    const { data: profile, isLoading: profileLoading } = useUserProfile(username);
    const blockMutation = useBlockUser();
    const { data: postsData, isLoading: postsLoading, refetch: refetchPosts } = useUserPosts(username);
    const { data: friendRequestsData } = useFriendRequests();
    const followMutation = useFollow();
    const unfollowMutation = useUnfollow();
    const acceptFriendRequestMutation = useAcceptFriendRequest();
    const rejectFriendRequestMutation = useRejectFriendRequest();
    const cancelFriendRequestMutation = useCancelFriendRequest();

    const isOwnProfile = currentUser?.username === username;
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
            <div className="theme-surface rounded-2xl overflow-hidden mb-6 border border-[#2A2A2A] card-shadow">
                {/* Cover Image */}
                <div 
                    className="h-64 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 relative"
                    style={{
                        backgroundImage: profile.cover_image 
                            ? `url(${profile.cover_image})` 
                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    {/* Profile Picture - Centered, overlapping bottom */}
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full border-4 border-[var(--theme-surface)] p-1 theme-surface">
                                <Avatar 
                                    src={profile.profile_picture} 
                                    alt={profile.name} 
                                    size="2xl"
                                    className="w-full h-full"
                                />
                            </div>
                            <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[var(--theme-surface)]" title="Online" aria-hidden />
                        </div>
                    </div>
                </div>

                {/* Profile Info Section */}
                <div className="pt-16 pb-6 px-8">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-white mb-1">{profile.name}</h1>
                            {profile.username && (
                                <p className="text-gray-400 text-base mb-2">@{profile.username}</p>
                            )}
                            {profile.bio && (
                                <p className="text-gray-400 mb-3">{profile.bio}</p>
                            )}
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
                                <Link 
                                    to="/edit-profile"
                                    className="px-6 py-2 border border-[#374151] rounded-xl hover:bg-white/5 font-medium text-white transition-colors inline-block"
                                >
                                    Edit Profile
                                </Link>
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
                                                className="px-6 py-2 border border-[#374151] text-white rounded-xl font-medium transition-colors hover:bg-white/5 flex items-center space-x-2 cursor-pointer"
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
                                                className="px-6 py-2 bg-[var(--theme-accent)] text-white rounded-xl font-medium transition-colors hover:opacity-90 flex items-center space-x-2"
                                            >
                                                <span className="material-symbols-outlined text-lg">check</span>
                                                <span>Accept</span>
                                            </button>
                                            <button
                                                onClick={() => rejectFriendRequestMutation.mutate(receivedRequest?.id)}
                                                disabled={rejectFriendRequestMutation.isPending}
                                                className="px-6 py-2 bg-white/10 text-gray-400 rounded-xl font-medium transition-colors hover:bg-white/20 flex items-center space-x-2"
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
                                            className="px-6 py-2 bg-[var(--theme-accent)] text-white rounded-xl font-medium transition-colors hover:opacity-90 flex items-center space-x-2 cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-lg">person_add</span>
                                            <span>Connect</span>
                                        </button>
                                    )}
                                    <Link
                                        to={`/messages/${username}`}
                                        className="px-6 py-2 border border-[#374151] rounded-xl hover:bg-white/5 font-medium text-white transition-colors flex items-center space-x-2"
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

                {/* Profile Navigation Tabs */}
                <div className="border-t border-[#2A2A2A] px-8">
                    <div className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab('posts')}
                            className={`py-4 font-medium border-b-2 transition-colors ${
                                activeTab === 'posts'
                                    ? 'text-[var(--theme-accent)] border-[var(--theme-accent)]'
                                    : 'text-gray-400 border-transparent hover:text-white'
                            }`}
                        >
                            Posts
                        </button>
                        <button
                            onClick={() => setActiveTab('media')}
                            className={`py-4 font-medium border-b-2 transition-colors ${
                                activeTab === 'media'
                                    ? 'text-[var(--theme-accent)] border-[var(--theme-accent)]'
                                    : 'text-gray-400 border-transparent hover:text-white'
                            }`}
                        >
                            Media
                        </button>
                        <button
                            onClick={() => setActiveTab('communities')}
                            className={`py-4 font-medium border-b-2 transition-colors ${
                                activeTab === 'communities'
                                    ? 'text-[var(--theme-accent)] border-[var(--theme-accent)]'
                                    : 'text-gray-400 border-transparent hover:text-white'
                            }`}
                        >
                            Communities
                        </button>
                        <button
                            onClick={() => setActiveTab('more')}
                            className={`py-4 font-medium border-b-2 transition-colors ${
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
                {/* Left Sidebar */}
                <div className="lg:w-1/3 space-y-6">
                    {/* About Section */}
                    <div className="theme-surface rounded-2xl border border-[#2A2A2A] p-6 card-shadow">
                        <h2 className="text-xl font-bold text-white mb-4">About</h2>
                        {profile.bio && (
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-400 mb-2">Bio</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">{profile.bio}</p>
                            </div>
                        )}
                        <div className="space-y-3">
                            {profile.website && (
                                <div className="flex items-start space-x-2">
                                    <span className="material-symbols-outlined text-gray-500 text-sm mt-0.5">link</span>
                                    <a
                                        href={profile.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-[var(--theme-accent)] hover:underline"
                                    >
                                        {profile.website}
                                    </a>
                                </div>
                            )}
                            {profile.location && (
                                <div className="flex items-start space-x-2">
                                    <span className="material-symbols-outlined text-gray-500 text-sm mt-0.5">work</span>
                                    <span className="text-sm text-gray-400">{profile.location}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Network Section */}
                    <div className="theme-surface rounded-2xl border border-[#2A2A2A] p-6 card-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">Network</h2>
                            <Link to={`/profile/${username}/connections`} className="text-sm text-[var(--theme-accent)] hover:underline font-medium">
                                SEE ALL
                            </Link>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            {followersPreview.slice(0, 6).map((f) => (
                                <Link key={f.id} to={`/profile/${f.username}`} className="flex flex-col items-center group">
                                    <div className="relative">
                                        <Avatar
                                            src={f.profile_picture}
                                            alt={f.name}
                                            size="md"
                                            className="group-hover:ring-2 group-hover:ring-[var(--theme-accent)] rounded-full transition-all"
                                        />
                                    </div>
                                    <span className="text-xs text-gray-400 mt-1 text-center truncate w-full group-hover:text-[var(--theme-accent)]">{f.name}</span>
                                </Link>
                            ))}
                            {extraCount > 0 && (
                                <Link to={`/profile/${username}/connections`} className="flex flex-col items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-gray-400 font-semibold text-sm">
                                        +{extraCount}
                                    </div>
                                    <span className="text-xs text-gray-500 mt-1">more</span>
                                </Link>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 text-center">
                            {profile.followers_count || 0} connections
                        </p>
                    </div>
                </div>

                {/* Main Content - Posts Feed */}
                <div className="lg:w-2/3 space-y-6">
                    {/* Post Input - Only show if viewing own profile */}
                    {isOwnProfile && (
                        <div className="theme-surface rounded-2xl border border-[#2A2A2A] p-6 card-shadow">
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
                        <div className="theme-surface rounded-2xl border border-[#2A2A2A] p-12 text-center card-shadow">
                            <p className="text-gray-500">No posts yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
