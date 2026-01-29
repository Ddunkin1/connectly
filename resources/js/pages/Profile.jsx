import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUserProfile, useUserPosts, useFollow, useUnfollow } from '../hooks/useUsers';
import { useFriendRequests, useAcceptFriendRequest, useRejectFriendRequest, useCancelFriendRequest } from '../hooks/useFriendRequests';
import useAuthStore from '../store/authStore';
import Avatar from '../components/common/Avatar';
import PostCard from '../components/posts/PostCard';
import PostInput from '../components/posts/PostInput';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatDate } from '../utils/formatDate';

const Profile = () => {
    const { username } = useParams();
    const currentUser = useAuthStore((state) => state.user);
    const [activeTab, setActiveTab] = useState('posts');
    
    const { data: profile, isLoading: profileLoading } = useUserProfile(username);
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
            <div className="text-center py-12">
                <p className="text-gray-500">User not found</p>
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

    return (
        <div className="max-w-7xl mx-auto">
            {/* Profile Banner Section */}
            <div className="bg-white rounded-lg overflow-hidden mb-4 shadow-sm">
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
                    {/* Profile Picture - Overlapping */}
                    <div className="absolute bottom-0 left-8 transform translate-y-1/2">
                        <div className="w-32 h-32 rounded-full border-4 border-white bg-white p-1">
                            <Avatar 
                                src={profile.profile_picture} 
                                alt={profile.name} 
                                size="2xl"
                                className="w-full h-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Profile Info Section */}
                <div className="pt-16 pb-6 px-8">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900 mb-1">{profile.name}</h1>
                            {profile.bio && (
                                <p className="text-gray-600 mb-3">{profile.bio}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
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
                                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700 transition-colors inline-block"
                                >
                                    Edit Profile
                                </Link>
                            ) : (
                                <>
                                    {friendRequestStatus === 'sent' ? (
                                        <div className="flex items-center gap-2">
                                            <span className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium flex items-center space-x-2">
                                                <span className="material-symbols-outlined text-lg">hourglass_empty</span>
                                                <span>Request Sent</span>
                                            </span>
                                            <button
                                                onClick={() => cancelFriendRequestMutation.mutate(sentRequest?.id)}
                                                disabled={cancelFriendRequestMutation.isPending || !sentRequest?.id || String(sentRequest?.id).startsWith('temp-')}
                                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium transition-colors hover:bg-gray-50 flex items-center space-x-2 cursor-pointer"
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
                                                className="px-6 py-2 bg-[#359EFF] text-white rounded-lg font-medium transition-colors hover:bg-[#2a8eef] flex items-center space-x-2"
                                            >
                                                <span className="material-symbols-outlined text-lg">check</span>
                                                <span>Accept</span>
                                            </button>
                                            <button
                                                onClick={() => rejectFriendRequestMutation.mutate(receivedRequest?.id)}
                                                disabled={rejectFriendRequestMutation.isPending}
                                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors hover:bg-gray-300 flex items-center space-x-2"
                                            >
                                                <span className="material-symbols-outlined text-lg">close</span>
                                                <span>Reject</span>
                                            </button>
                                        </div>
                                    ) : isFollowing ? (
                                        <button
                                            onClick={() => unfollowMutation.mutate(profile.id)}
                                            disabled={unfollowMutation.isPending}
                                            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors hover:bg-gray-300 flex items-center space-x-2 cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-lg">person_remove</span>
                                            <span>Unfollow</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => followMutation.mutate(profile.id)}
                                            disabled={followMutation.isPending}
                                            className="px-6 py-2 bg-[#359EFF] text-white rounded-lg font-medium transition-colors hover:bg-[#2a8eef] flex items-center space-x-2 cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-lg">person_add</span>
                                            <span>Connect</span>
                                        </button>
                                    )}
                                    <Link
                                        to={`/messages/${username}`}
                                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700 transition-colors flex items-center space-x-2"
                                    >
                                        <span className="material-symbols-outlined text-lg">mail</span>
                                        <span>Message</span>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Profile Navigation Tabs */}
                <div className="border-t border-gray-200 px-8">
                    <div className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab('posts')}
                            className={`py-4 font-medium border-b-2 transition-colors ${
                                activeTab === 'posts'
                                    ? 'text-[#359EFF] border-[#359EFF]'
                                    : 'text-gray-500 border-transparent hover:text-gray-700'
                            }`}
                        >
                            Posts
                        </button>
                        <button
                            onClick={() => setActiveTab('media')}
                            className={`py-4 font-medium border-b-2 transition-colors ${
                                activeTab === 'media'
                                    ? 'text-[#359EFF] border-[#359EFF]'
                                    : 'text-gray-500 border-transparent hover:text-gray-700'
                            }`}
                        >
                            Media
                        </button>
                        <button
                            onClick={() => setActiveTab('communities')}
                            className={`py-4 font-medium border-b-2 transition-colors ${
                                activeTab === 'communities'
                                    ? 'text-[#359EFF] border-[#359EFF]'
                                    : 'text-gray-500 border-transparent hover:text-gray-700'
                            }`}
                        >
                            Communities
                        </button>
                        <button
                            onClick={() => setActiveTab('more')}
                            className={`py-4 font-medium border-b-2 transition-colors ${
                                activeTab === 'more'
                                    ? 'text-[#359EFF] border-[#359EFF]'
                                    : 'text-gray-500 border-transparent hover:text-gray-700'
                            }`}
                        >
                            More
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col lg:flex-row gap-4">
                {/* Left Sidebar */}
                <div className="lg:w-1/3 space-y-4">
                    {/* About Section */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
                        {profile.bio && (
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">Bio</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">{profile.bio}</p>
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
                                        className="text-sm text-[#359EFF] hover:underline"
                                    >
                                        {profile.website}
                                    </a>
                                </div>
                            )}
                            {profile.location && (
                                <div className="flex items-start space-x-2">
                                    <span className="material-symbols-outlined text-gray-500 text-sm mt-0.5">work</span>
                                    <span className="text-sm text-gray-600">{profile.location}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Network Section */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Network</h2>
                            <Link to={`/profile/${username}/connections`} className="text-sm text-[#359EFF] hover:underline font-medium">
                                SEE ALL
                            </Link>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            {/* Mock connections - Replace with actual data */}
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="flex flex-col items-center">
                                    <Avatar 
                                        src={null} 
                                        alt={`Connection ${i}`} 
                                        size="md"
                                    />
                                    <span className="text-xs text-gray-600 mt-1 text-center">User {i}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-sm text-gray-500 text-center">
                            {profile.followers_count || 0} connections
                        </p>
                    </div>
                </div>

                {/* Main Content - Posts Feed */}
                <div className="lg:w-2/3 space-y-4">
                    {/* Post Input - Only show if viewing own profile */}
                    {isOwnProfile && (
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <PostInput onPostCreated={refetchPosts} />
                        </div>
                    )}

                    {/* Posts Feed */}
                    {postsLoading ? (
                        <div className="flex justify-center py-12">
                            <LoadingSpinner />
                        </div>
                    ) : posts.length > 0 ? (
                        <div className="space-y-4">
                            {posts.map((post) => (
                                <PostCard key={post.id} post={post} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                            <p className="text-gray-500">No posts yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
