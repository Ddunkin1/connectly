import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useUserProfile, useUserPosts, useUserCommunities, useFollow, useUnfollow, useUpdateProfile, useProfilePictureHistory, useCoverImageHistory } from '../hooks/useUsers';
import { useFriendRequests, useAcceptFriendRequest, useRejectFriendRequest, useCancelFriendRequest } from '../hooks/useFriendRequests';
import { useBlockUser } from '../hooks/useBlocks';
import ReportModal from '../components/common/ReportModal';
import EditProfileModal from '../components/profile/EditProfileModal';
import MediaView from '../components/modal/MediaView';
import useAuthStore from '../store/authStore';
import Avatar from '../components/common/Avatar';
import AuthImage from '../components/common/AuthImage';
import PostCard from '../components/posts/PostCard';
import PostInput from '../components/posts/PostInput';
import {
    ProfileSkeleton,
    FeedSkeleton,
    MediaGridSkeleton,
    SkeletonBlock,
} from '../components/common/skeletons';
import { formatDate } from '../utils/formatDate';
import { useStories } from '../hooks/useStories';
import { useProfileComments, useCreateProfileComment, useUpdateProfileComment, useHideProfileComment, useUnhideProfileComment, useDeleteProfileComment } from '../hooks/useProfileComments';
import { useComments, useCreateComment } from '../hooks/useComments';
import { useLikePost, useUnlikePost } from '../hooks/usePosts';
import CommentThread from '../components/posts/CommentThread';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

const COVER_GRADIENT = 'linear-gradient(135deg, #4b5563 0%, #374151 50%, #1f2937 100%)';

/** Resolve cover URL: when API returns relative path and VITE_API_URL is set (production), prepend API base */
function resolveCoverUrl(url) {
    if (!url || !url.startsWith('/')) return url;
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) return url; // Local dev: relative path resolves via proxy
    const base = apiUrl.replace(/\/api\/?$/, '');
    return base ? `${base}${url}` : url;
}

/** Like + Share row for profile picture lightbox when a linked post exists */
function ProfilePictureLightboxLikeShare({ post, onCopyLink }) {
    const [optimisticLike, setOptimisticLike] = useState(null);
    const likeMutation = useLikePost();
    const unlikeMutation = useUnlikePost();
    const isLiked = optimisticLike !== null ? optimisticLike.is_liked : (post?.is_liked ?? false);
    const likesCount = optimisticLike !== null ? optimisticLike.likes_count : (post?.likes_count ?? 0);

    const handleLike = () => {
        if (isLiked) {
            setOptimisticLike({ is_liked: false, likes_count: Math.max(0, likesCount - 1) });
            unlikeMutation.mutate(post.id);
        } else {
            setOptimisticLike({ is_liked: true, likes_count: likesCount + 1 });
            likeMutation.mutate(post.id);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={handleLike}
                disabled={likeMutation.isPending || unlikeMutation.isPending}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition disabled:opacity-60 ${
                    isLiked ? 'text-rose-500 bg-rose-500/10' : 'bg-[var(--theme-surface-hover)] hover:opacity-90 text-[var(--text-primary)]'
                } font-medium`}
            >
                <span className={`material-symbols-outlined text-xl ${isLiked ? 'fill-rose-500' : ''}`}>favorite</span>
                <span>{likesCount > 999 ? `${(likesCount / 1000).toFixed(1)}k` : likesCount}</span>
            </button>
            <button
                type="button"
                onClick={onCopyLink}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--theme-surface-hover)] hover:opacity-90 text-[var(--text-primary)] font-medium transition"
            >
                <span className="material-symbols-outlined text-xl">share</span>
                <span>Share</span>
            </button>
        </>
    );
}

/**
 * Facebook-style lightbox: left half = full profile picture, right half = panel with:
 * - User card, Like (when post exists), Share, Message
 * - Profile comments: input + list (owner and others can comment)
 */
function ProfilePictureLightbox({ profile, isOwnProfile, onClose }) {
    const currentUser = useAuthStore((state) => state.user);
    const [openMenuCommentId, setOpenMenuCommentId] = useState(null);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [reportComment, setReportComment] = useState(null);
    const [replyingToCommentId, setReplyingToCommentId] = useState(null);
    const [replyContent, setReplyContent] = useState('');

    const profileUrl = typeof window !== 'undefined' && profile?.username
        ? `${window.location.origin}/profile/${profile.username}`
        : '';

    const profilePicturePostId = profile?.latest_profile_picture_post?.id ?? null;
    const { data: postCommentsData = [], isLoading: postCommentsLoading } = useComments(profilePicturePostId);
    const createPostCommentMutation = useCreateComment();

    const { data: comments = [], isLoading: commentsLoading } = useProfileComments(profile?.id);
    const createCommentMutation = useCreateProfileComment();
    const updateCommentMutation = useUpdateProfileComment();
    const hideCommentMutation = useHideProfileComment();
    const unhideCommentMutation = useUnhideProfileComment();
    const deleteCommentMutation = useDeleteProfileComment();
    const { register, handleSubmit, reset } = useForm();

    const handleCopyLink = async () => {
        if (!profileUrl) return;
        try {
            await navigator.clipboard.writeText(profileUrl);
            toast.success('Link copied to clipboard');
        } catch (_) {
            toast.error('Could not copy link');
        }
    };

    const onSubmitComment = (data) => {
        if (!profile?.id || !data.content?.trim()) return;
        createCommentMutation.mutate(
            { userId: profile.id, data: { content: data.content.trim() } },
            { onSuccess: () => reset() }
        );
    };

    const getRootCommentId = (comment) => comment.parent_comment_id || comment.id;

    const handleReplySubmit = (e) => {
        e.preventDefault();
        if (!profile?.id || !replyingToCommentId || !replyContent.trim()) return;
        createCommentMutation.mutate(
            { userId: profile.id, data: { content: replyContent.trim(), parent_comment_id: replyingToCommentId } },
            { onSuccess: () => { setReplyingToCommentId(null); setReplyContent(''); } }
        );
    };

    const isAuthor = (comment) => currentUser && comment.user?.id === currentUser.id;
    const isProfileOwner = () => currentUser && profile && currentUser.id === profile.id;

    const handleStartEdit = (comment) => {
        setEditingCommentId(comment.id);
        setEditContent(comment.content);
        setOpenMenuCommentId(null);
    };

    const handleSaveEdit = () => {
        if (!editingCommentId || !editContent.trim()) return;
        updateCommentMutation.mutate(
            { commentId: editingCommentId, data: { content: editContent.trim() } },
            { onSuccess: () => { setEditingCommentId(null); setEditContent(''); } }
        );
    };

    const handleHideComment = (comment) => {
        hideCommentMutation.mutate(comment.id);
        setOpenMenuCommentId(null);
    };

    const handleUnhideComment = (comment) => {
        unhideCommentMutation.mutate(comment.id);
        setOpenMenuCommentId(null);
    };

    const handleDeleteComment = (comment) => {
        deleteCommentMutation.mutate(comment.id);
        setOpenMenuCommentId(null);
    };

    const handleReportComment = (comment) => {
        setReportComment(comment);
        setOpenMenuCommentId(null);
    };

    // Close menu when clicking outside
    useEffect(() => {
        if (!openMenuCommentId) return;
        const close = () => setOpenMenuCommentId(null);
        document.addEventListener('click', close);
        return () => document.removeEventListener('click', close);
    }, [openMenuCommentId]);

    return (
        <div
            className="fixed inset-0 z-50 flex bg-black"
            role="dialog"
            aria-modal="true"
            aria-label="Profile picture"
        >
            {/* Left half — image */}
            <div className="flex-1 min-w-0 flex items-center justify-center p-4 bg-black/95">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 left-4 z-10 p-2 rounded-full text-white/90 hover:bg-white/10 hover:text-white transition focus:outline-none focus:ring-2 focus:ring-white/50"
                    aria-label="Close"
                >
                    <span className="material-symbols-outlined text-2xl">close</span>
                </button>
                {profile.profile_picture ? (
                    <img
                        src={profile.profile_picture}
                        alt={`${profile.name} — profile picture`}
                        className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                    />
                ) : (
                    <div className="w-48 h-48 rounded-lg bg-white/10 flex items-center justify-center text-white/60">
                        No photo
                    </div>
                )}
            </div>

            {/* Right half — panel: user, share, message, comments */}
            <div className="w-full max-w-[420px] min-w-[320px] flex flex-col bg-[var(--theme-surface)] border-l border-[var(--theme-border)] overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-[var(--theme-border)] shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <Avatar src={profile.profile_picture} alt={profile.name} size="lg" />
                        <div className="min-w-0">
                            <p className="font-semibold text-[var(--text-primary)] truncate">{profile.name}</p>
                            {profile.username && (
                                <p className="text-sm text-[var(--text-secondary)] truncate">@{profile.username}</p>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-[var(--theme-surface-hover)] text-[var(--text-secondary)] transition"
                        aria-label="Close"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Actions: Like (when post exists), Share, Message */}
                <div className="flex items-center gap-2 p-4 border-b border-[var(--theme-border)] shrink-0 flex-wrap">
                    {profile?.latest_profile_picture_post && (
                        <ProfilePictureLightboxLikeShare
                            post={profile.latest_profile_picture_post}
                            onCopyLink={handleCopyLink}
                        />
                    )}
                    {!profile?.latest_profile_picture_post && (
                        <button
                            type="button"
                            onClick={handleCopyLink}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--theme-surface-hover)] hover:opacity-90 text-[var(--text-primary)] font-medium transition"
                        >
                            <span className="material-symbols-outlined text-xl">share</span>
                            <span>Share</span>
                        </button>
                    )}
                    {!isOwnProfile && profile?.username && (
                        <Link
                            to={`/messages/${profile.username}`}
                            onClick={onClose}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--theme-accent)] hover:opacity-90 text-white font-medium transition"
                        >
                            <span className="material-symbols-outlined text-xl">mail</span>
                            <span>Message</span>
                        </Link>
                    )}
                </div>

                {/* Comments: when profile picture is a post, show post comments (with Pin/Author); else profile comments */}
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {profile?.latest_profile_picture_post ? (
                        <>
                            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide px-4 pt-4 pb-2 shrink-0">
                                Comments {Array.isArray(postCommentsData) && postCommentsData.filter((c) => !c.parent_comment_id).length > 0 && `(${postCommentsData.filter((c) => !c.parent_comment_id).length})`}
                            </h3>
                            {currentUser && (
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        const content = e.currentTarget.content?.value?.trim();
                                        if (!content || !profilePicturePostId) return;
                                        createPostCommentMutation.mutate(
                                            { postId: profilePicturePostId, data: { content } },
                                            { onSuccess: () => e.currentTarget.reset() }
                                        );
                                    }}
                                    className="p-4 pt-0 shrink-0"
                                >
                                    <div className="flex gap-3">
                                        <Avatar src={currentUser.profile_picture} alt={currentUser.name} size="md" />
                                        <div className="flex-1 min-w-0">
                                            <textarea
                                                name="content"
                                                placeholder="Write a comment..."
                                                rows={2}
                                                className="w-full px-3 py-2 rounded-xl bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] resize-none text-sm"
                                            />
                                            <div className="flex justify-end mt-2">
                                                <button
                                                    type="submit"
                                                    disabled={createPostCommentMutation.isPending}
                                                    className="px-3 py-1.5 rounded-full bg-[var(--theme-accent)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                                                >
                                                    {createPostCommentMutation.isPending ? 'Posting...' : 'Comment'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            )}
                            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
                                {postCommentsLoading ? (
                                    <p className="text-sm text-[var(--text-secondary)]">Loading comments...</p>
                                ) : (Array.isArray(postCommentsData) ? postCommentsData.filter((c) => !c.parent_comment_id) : []).length === 0 ? (
                                    <p className="text-sm text-[var(--text-secondary)]">No comments yet. Be the first!</p>
                                ) : (
                                    (Array.isArray(postCommentsData) ? postCommentsData.filter((c) => !c.parent_comment_id) : []).map((comment) => (
                                        <CommentThread
                                            key={comment.id}
                                            postId={profilePicturePostId}
                                            comment={comment}
                                            postAuthorId={profile.id}
                                        />
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide px-4 pt-4 pb-2 shrink-0">
                                Comments {comments.length > 0 && `(${comments.length})`}
                            </h3>
                            {currentUser && (
                                <form onSubmit={handleSubmit(onSubmitComment)} className="p-4 pt-0 shrink-0">
                                    <div className="flex gap-3">
                                        <Avatar src={currentUser.profile_picture} alt={currentUser.name} size="md" />
                                        <div className="flex-1 min-w-0">
                                            <textarea
                                                {...register('content', { required: true, maxLength: 1000 })}
                                                placeholder="Write a comment on this profile..."
                                                rows={2}
                                                className="w-full px-3 py-2 rounded-xl bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] resize-none text-sm"
                                            />
                                            <div className="flex justify-end mt-2">
                                                <button
                                                    type="submit"
                                                    disabled={createCommentMutation.isPending}
                                                    className="px-3 py-1.5 rounded-full bg-[var(--theme-accent)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                                                >
                                                    {createCommentMutation.isPending ? 'Posting...' : 'Comment'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            )}
                            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
                                {commentsLoading ? (
                                    <p className="text-sm text-[var(--text-secondary)]">Loading comments...</p>
                                ) : comments.length === 0 ? (
                            <p className="text-sm text-[var(--text-secondary)]">
                                {isOwnProfile ? 'No comments yet on your profile.' : 'No comments yet. Be the first!'}
                            </p>
                        ) : (
                            comments.map((comment) => (
                                <div key={comment.id} className="space-y-2">
                                <div
                                    className={`flex gap-3 group ${comment.is_hidden && isProfileOwner() ? 'opacity-75' : ''}`}
                                >
                                    <Avatar
                                        src={comment.user?.profile_picture}
                                        alt={comment.user?.name}
                                        size="sm"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium text-sm text-[var(--text-primary)]">
                                                {comment.user?.name}
                                            </span>
                                            <span className="text-xs text-[var(--text-secondary)]">
                                                {formatDate(comment.created_at)}
                                            </span>
                                            {currentUser && (
                                                <div className="relative ml-auto">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); setOpenMenuCommentId(openMenuCommentId === comment.id ? null : comment.id); }}
                                                        className="p-1 rounded-full hover:bg-[var(--theme-surface-hover)] text-[var(--text-secondary)]"
                                                        aria-label="Comment options"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">more_horiz</span>
                                                    </button>
                                                    {openMenuCommentId === comment.id && (
                                                        <div
                                                            className="absolute right-0 top-full mt-1 py-1 min-w-[140px] rounded-lg bg-[var(--theme-surface)] border border-[var(--theme-border)] shadow-lg z-50"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {isAuthor(comment) && !isProfileOwner() && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleStartEdit(comment)}
                                                                        className="w-full px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] flex items-center gap-2"
                                                                    >
                                                                        <span className="material-symbols-outlined text-base">edit</span>
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeleteComment(comment)}
                                                                        disabled={deleteCommentMutation.isPending}
                                                                        className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-[var(--theme-surface-hover)] flex items-center gap-2"
                                                                    >
                                                                        <span className="material-symbols-outlined text-base">delete</span>
                                                                        Delete
                                                                    </button>
                                                                </>
                                                            )}
                                                            {isProfileOwner() && !isAuthor(comment) && (
                                                                <>
                                                                    {comment.is_hidden ? (
                                                                        <>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleUnhideComment(comment)}
                                                                                disabled={unhideCommentMutation.isPending}
                                                                                className="w-full px-3 py-2 text-left text-sm text-[var(--theme-accent)] hover:bg-[var(--theme-surface-hover)] flex items-center gap-2"
                                                                            >
                                                                                <span className="material-symbols-outlined text-base">visibility</span>
                                                                                Unhide
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleDeleteComment(comment)}
                                                                                disabled={deleteCommentMutation.isPending}
                                                                                className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-[var(--theme-surface-hover)] flex items-center gap-2"
                                                                            >
                                                                                <span className="material-symbols-outlined text-base">delete</span>
                                                                                Delete
                                                                            </button>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <button type="button" onClick={() => handleDeleteComment(comment)} disabled={deleteCommentMutation.isPending} className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-[var(--theme-surface-hover)] flex items-center gap-2">
                                                                                <span className="material-symbols-outlined text-base">delete</span>
                                                                                Delete
                                                                            </button>
                                                                            <button type="button" onClick={() => handleHideComment(comment)} disabled={hideCommentMutation.isPending} className="w-full px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] flex items-center gap-2">
                                                                                <span className="material-symbols-outlined text-base">visibility_off</span>
                                                                                Hide comment
                                                                            </button>
                                                                            <button type="button" onClick={() => handleReportComment(comment)} className="w-full px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] flex items-center gap-2">
                                                                                <span className="material-symbols-outlined text-base">flag</span>
                                                                                Report comment
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                </>
                                                            )}
                                                            {isProfileOwner() && isAuthor(comment) && (
                                                                <>
                                                                    {comment.is_hidden ? (
                                                                        <>
                                                                            <button type="button" onClick={() => handleUnhideComment(comment)} disabled={unhideCommentMutation.isPending} className="w-full px-3 py-2 text-left text-sm text-[var(--theme-accent)] hover:bg-[var(--theme-surface-hover)] flex items-center gap-2">
                                                                                <span className="material-symbols-outlined text-base">visibility</span>
                                                                                Unhide
                                                                            </button>
                                                                            <button type="button" onClick={() => handleDeleteComment(comment)} disabled={deleteCommentMutation.isPending} className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-[var(--theme-surface-hover)] flex items-center gap-2">
                                                                                <span className="material-symbols-outlined text-base">delete</span>
                                                                                Delete
                                                                            </button>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <button type="button" onClick={() => handleStartEdit(comment)} className="w-full px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] flex items-center gap-2">
                                                                                <span className="material-symbols-outlined text-base">edit</span>
                                                                                Edit
                                                                            </button>
                                                                            <button type="button" onClick={() => handleDeleteComment(comment)} disabled={deleteCommentMutation.isPending} className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-[var(--theme-surface-hover)] flex items-center gap-2">
                                                                                <span className="material-symbols-outlined text-base">delete</span>
                                                                                Delete
                                                                            </button>
                                                                            <button type="button" onClick={() => handleHideComment(comment)} disabled={hideCommentMutation.isPending} className="w-full px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] flex items-center gap-2">
                                                                                <span className="material-symbols-outlined text-base">visibility_off</span>
                                                                                Hide comment
                                                                            </button>
                                                                            <button type="button" onClick={() => handleReportComment(comment)} className="w-full px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] flex items-center gap-2">
                                                                                <span className="material-symbols-outlined text-base">flag</span>
                                                                                Report comment
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                </>
                                                            )}
                                                            {currentUser && !isAuthor(comment) && !isProfileOwner() && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleReportComment(comment)}
                                                                    className="w-full px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] flex items-center gap-2"
                                                                >
                                                                    <span className="material-symbols-outlined text-base">flag</span>
                                                                    Report comment
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {editingCommentId === comment.id && !comment.is_hidden ? (
                                            <div className="mt-2">
                                                <textarea
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    rows={2}
                                                    className="w-full px-3 py-2 rounded-lg bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] text-[var(--text-primary)] text-sm resize-none"
                                                    autoFocus
                                                />
                                                <div className="flex gap-2 mt-2">
                                                    <button
                                                        type="button"
                                                        onClick={handleSaveEdit}
                                                        disabled={updateCommentMutation.isPending || !editContent.trim()}
                                                        className="px-3 py-1.5 rounded-full bg-[var(--theme-accent)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => { setEditingCommentId(null); setEditContent(''); }}
                                                        className="px-3 py-1.5 rounded-full bg-[var(--theme-surface-hover)] text-[var(--text-primary)] text-sm font-medium"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : comment.is_hidden && isProfileOwner() ? (
                                            <p className="text-sm text-[var(--text-secondary)] mt-0.5 italic">Hidden comment</p>
                                        ) : (
                                            <p className="text-sm text-[var(--text-primary)] mt-0.5 break-words">{comment.content}</p>
                                        )}
                                        {currentUser && !comment.is_hidden && (
                                            <button
                                                type="button"
                                                onClick={() => setReplyingToCommentId(comment.id)}
                                                className="text-xs text-[var(--theme-accent)] hover:underline mt-1"
                                            >
                                                Reply
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Nested replies */}
                                {(comment.replies || []).map((reply) => (
                                    <div
                                        key={reply.id}
                                        className={`flex gap-3 group pl-6 border-l-2 border-[var(--theme-border)] ml-2 ${reply.is_hidden && isProfileOwner() ? 'opacity-75' : ''}`}
                                    >
                                        <Avatar src={reply.user?.profile_picture} alt={reply.user?.name} size="sm" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-medium text-sm text-[var(--text-primary)]">{reply.user?.name}</span>
                                                <span className="text-xs text-[var(--text-secondary)]">{formatDate(reply.created_at)}</span>
                                                {currentUser && (
                                                    <div className="relative ml-auto">
                                                        <button type="button" onClick={(e) => { e.stopPropagation(); setOpenMenuCommentId(openMenuCommentId === reply.id ? null : reply.id); }} className="p-1 rounded-full hover:bg-[var(--theme-surface-hover)] text-[var(--text-secondary)]" aria-label="Comment options">
                                                            <span className="material-symbols-outlined text-lg">more_horiz</span>
                                                        </button>
                                                        {openMenuCommentId === reply.id && (
                                                            <div className="absolute right-0 top-full mt-1 py-1 min-w-[140px] rounded-lg bg-[var(--theme-surface)] border border-[var(--theme-border)] shadow-lg z-50" onClick={(e) => e.stopPropagation()}>
                                                                {isAuthor(reply) && (
                                                                    <>
                                                                        <button type="button" onClick={() => handleStartEdit(reply)} className="w-full px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] flex items-center gap-2">
                                                                            <span className="material-symbols-outlined text-base">edit</span> Edit
                                                                        </button>
                                                                        <button type="button" onClick={() => handleDeleteComment(reply)} disabled={deleteCommentMutation.isPending} className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-[var(--theme-surface-hover)] flex items-center gap-2">
                                                                            <span className="material-symbols-outlined text-base">delete</span> Delete
                                                                        </button>
                                                                    </>
                                                                )}
                                                                {isProfileOwner() && !isAuthor(reply) && (
                                                                    reply.is_hidden ? (
                                                                        <>
                                                                            <button type="button" onClick={() => handleUnhideComment(reply)} disabled={unhideCommentMutation.isPending} className="w-full px-3 py-2 text-left text-sm text-[var(--theme-accent)] hover:bg-[var(--theme-surface-hover)] flex items-center gap-2">
                                                                                <span className="material-symbols-outlined text-base">visibility</span> Unhide
                                                                            </button>
                                                                            <button type="button" onClick={() => handleDeleteComment(reply)} disabled={deleteCommentMutation.isPending} className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-[var(--theme-surface-hover)] flex items-center gap-2">
                                                                                <span className="material-symbols-outlined text-base">delete</span> Delete
                                                                            </button>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <button type="button" onClick={() => handleDeleteComment(reply)} disabled={deleteCommentMutation.isPending} className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-[var(--theme-surface-hover)] flex items-center gap-2">
                                                                                <span className="material-symbols-outlined text-base">delete</span> Delete
                                                                            </button>
                                                                            <button type="button" onClick={() => handleHideComment(reply)} disabled={hideCommentMutation.isPending} className="w-full px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] flex items-center gap-2">
                                                                                <span className="material-symbols-outlined text-base">visibility_off</span> Hide comment
                                                                            </button>
                                                                            <button type="button" onClick={() => handleReportComment(reply)} className="w-full px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] flex items-center gap-2">
                                                                                <span className="material-symbols-outlined text-base">flag</span> Report comment
                                                                            </button>
                                                                        </>
                                                                    )
                                                                )}
                                                                {currentUser && !isAuthor(reply) && !isProfileOwner() && (
                                                                    <button type="button" onClick={() => handleReportComment(reply)} className="w-full px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] flex items-center gap-2">
                                                                        <span className="material-symbols-outlined text-base">flag</span> Report comment
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            {reply.is_hidden && isProfileOwner() ? (
                                                <p className="text-sm text-[var(--text-secondary)] mt-0.5 italic">Hidden comment</p>
                                            ) : (
                                                <p className="text-sm text-[var(--text-primary)] mt-0.5 break-words">{reply.content}</p>
                                            )}
                                            {currentUser && !reply.is_hidden && (
                                                <button type="button" onClick={() => setReplyingToCommentId(comment.id)} className="text-xs text-[var(--theme-accent)] hover:underline mt-1">
                                                    Reply
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* Reply form */}
                                {replyingToCommentId === comment.id && currentUser && (
                                    <form onSubmit={handleReplySubmit} className="pl-6 ml-2 border-l-2 border-[var(--theme-border)] flex gap-3 mt-2">
                                        <Avatar src={currentUser.profile_picture} alt={currentUser.name} size="sm" />
                                        <div className="flex-1 min-w-0">
                                            <textarea
                                                value={replyContent}
                                                onChange={(e) => setReplyContent(e.target.value)}
                                                placeholder="Write a reply..."
                                                rows={2}
                                                className="w-full px-3 py-2 rounded-lg bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]"
                                            />
                                            <div className="flex gap-2 mt-2">
                                                <button
                                                    type="submit"
                                                    disabled={createCommentMutation.isPending || !replyContent.trim()}
                                                    className="px-3 py-1.5 rounded-full bg-[var(--theme-accent)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                                                >
                                                    {createCommentMutation.isPending ? 'Posting...' : 'Reply'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => { setReplyingToCommentId(null); setReplyContent(''); }}
                                                    className="px-3 py-1.5 rounded-full bg-[var(--theme-surface-hover)] text-[var(--text-primary)] text-sm font-medium"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                )}
                            </div>
                            ))
                        )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {reportComment && (
                <ReportModal
                    isOpen={!!reportComment}
                    onClose={() => setReportComment(null)}
                    reportableType="profile_comment"
                    reportableId={reportComment.id}
                    title="Report comment"
                />
            )}
        </div>
    );
}

const Profile = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const currentUser = useAuthStore((state) => state.user);
    const [activeTab, setActiveTab] = useState('posts');
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [profilePictureModalOpen, setProfilePictureModalOpen] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const [coverImageFailed, setCoverImageFailed] = useState(false);
    const [selectedMediaPost, setSelectedMediaPost] = useState(null);
    const [selectedHistoryImage, setSelectedHistoryImage] = useState(null); // { url, type: 'profile-pictures' | 'cover-images' }
    const [isUpdatingProfilePicture, setIsUpdatingProfilePicture] = useState(false);
    const [isUpdatingCoverImage, setIsUpdatingCoverImage] = useState(false);
    const [mediaSubTab, setMediaSubTab] = useState('posts');
    const [imageCaptionModal, setImageCaptionModal] = useState(null); // { type: 'profile-picture'|'cover-image', file, previewUrl }
    const [imageCaptionText, setImageCaptionText] = useState('');
    const [imageVisibility, setImageVisibility] = useState('public'); // 'public' | 'friends'
    const profilePicInputRef = useRef(null);
    const coverInputRef = useRef(null);

    const { data: profile, isLoading: profileLoading } = useUserProfile(username);
    const updateProfileMutation = useUpdateProfile();
    const { data: storiesGrouped = [] } = useStories();
    const blockMutation = useBlockUser();
    const { data: postsData, isLoading: postsLoading, refetch: refetchPosts } = useUserPosts(username);
    const { data: userCommunities = [], isLoading: communitiesLoading } = useUserCommunities(username);
    const { data: friendRequestsData } = useFriendRequests();
    const followMutation = useFollow();
    const unfollowMutation = useUnfollow();
    const acceptFriendRequestMutation = useAcceptFriendRequest();
    const rejectFriendRequestMutation = useRejectFriendRequest();
    const cancelFriendRequestMutation = useCancelFriendRequest();

    const isOwnProfile = currentUser?.username === username;
    const fetchMediaHistory = isOwnProfile && activeTab === 'media';
    const { data: profilePictureHistoryItems = [], isLoading: profilePictureHistoryLoading } = useProfilePictureHistory(fetchMediaHistory);
    const { data: coverImageHistoryItems = [], isLoading: coverImageHistoryLoading } = useCoverImageHistory(fetchMediaHistory);

    const hasActiveStory = profile
        ? storiesGrouped.some(
              (group) => group.user?.id === profile.id && (group.stories?.length > 0 || group.has_unviewed)
          )
        : false;
    const isFollowing = profile?.is_following;
    const friendRequestStatus = profile?.friend_request_status; // 'sent', 'received', or null
    const posts = postsData?.posts || [];
    const mediaPosts = posts.filter((p) => p.media_url && (p.media_type === 'image' || !p.media_type));
    const communities = Array.isArray(userCommunities) ? userCommunities : (userCommunities?.data ?? []);

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

    const handleProfilePictureChange = (e) => {
        const file = e.target.files?.[0];
        if (!file || !isOwnProfile) return;
        setImageCaptionModal({ type: 'profile-picture', file, previewUrl: URL.createObjectURL(file) });
        setImageCaptionText('');
        setImageVisibility(profile?.profile_picture_visibility ?? 'public');
        e.target.value = '';
    };

    const handleCoverImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file || !isOwnProfile) return;
        setImageCaptionModal({ type: 'cover-image', file, previewUrl: URL.createObjectURL(file) });
        setImageCaptionText('');
        setImageVisibility(profile?.cover_image_visibility ?? 'public');
        e.target.value = '';
    };

    const submitImageWithCaption = () => {
        if (!imageCaptionModal) return;
        const formData = new FormData();
        const isProfile = imageCaptionModal.type === 'profile-picture';
        if (isProfile) {
            formData.append('profile_picture', imageCaptionModal.file);
            if (imageCaptionText.trim()) formData.append('profile_picture_caption', imageCaptionText.trim());
            formData.append('profile_picture_visibility', imageVisibility);
            setIsUpdatingProfilePicture(true);
        } else {
            formData.append('cover_image', imageCaptionModal.file);
            if (imageCaptionText.trim()) formData.append('cover_image_caption', imageCaptionText.trim());
            formData.append('cover_image_visibility', imageVisibility);
            setIsUpdatingCoverImage(true);
        }
        updateProfileMutation.mutate(formData, {
            onSettled: () => {
                setIsUpdatingProfilePicture(false);
                setIsUpdatingCoverImage(false);
            },
        });
        if (imageCaptionModal.previewUrl) URL.revokeObjectURL(imageCaptionModal.previewUrl);
        setImageCaptionModal(null);
        setImageCaptionText('');
    };

    const closeImageCaptionModal = () => {
        if (imageCaptionModal?.previewUrl) URL.revokeObjectURL(imageCaptionModal.previewUrl);
        setImageCaptionModal(null);
        setImageCaptionText('');
        setImageVisibility('public');
    };

    // Lightbox: lock scroll and Escape to close
    useEffect(() => {
        if (!profilePictureModalOpen) return;
        document.body.style.overflow = 'hidden';
        const onKeyDown = (e) => { if (e.key === 'Escape') setProfilePictureModalOpen(false); };
        window.addEventListener('keydown', onKeyDown);
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [profilePictureModalOpen]);

    // Image caption modal: lock scroll and Escape to close
    useEffect(() => {
        if (!imageCaptionModal) return;
        document.body.style.overflow = 'hidden';
        const modal = imageCaptionModal;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (modal.previewUrl) URL.revokeObjectURL(modal.previewUrl);
                setImageCaptionModal(null);
                setImageCaptionText('');
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [imageCaptionModal]);

    if (profileLoading) {
        return <ProfileSkeleton />;
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
        <div className="w-full max-w-[720px] mx-auto min-w-0 pl-0 pr-6 md:pr-8 py-6">
            {/* Profile Banner Section */}
            <div className="theme-surface rounded-2xl overflow-visible mb-6 border border-[var(--theme-border)] shadow-post-card relative min-w-0 w-full">
                {/* Cover Image - img with onError fallback to detect 403/404/502 */}
                <div 
                    className="h-64 relative overflow-hidden group"
                    style={{
                        background: COVER_GRADIENT,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="hidden"
                        onChange={handleCoverImageChange}
                        aria-label="Change cover image"
                    />
                    {profile.cover_image && !coverImageFailed && (
                        <img
                            src={resolveCoverUrl(profile.cover_image)}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={() => setCoverImageFailed(true)}
                        />
                    )}
                    {isUpdatingCoverImage && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                            <div className="flex items-center gap-2 text-white text-sm font-medium px-3 py-1 rounded-full bg-black/60">
                                <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                                <span>Updating cover photo...</span>
                            </div>
                        </div>
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
                    {isOwnProfile && (
                        <button
                            type="button"
                            onClick={() => coverInputRef.current?.click()}
                            disabled={updateProfileMutation.isPending}
                            className="absolute bottom-3 right-3 p-2.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
                            aria-label="Change cover image"
                        >
                            <span className="material-symbols-outlined text-xl">edit</span>
                        </button>
                    )}
                </div>

                {/* Profile picture + name in one row – slightly below banner so it doesn’t overlap */}
                <div className="relative z-10 flex items-center gap-5 px-6 md:px-8 -mt-8 min-w-0">
                    <input
                        ref={profilePicInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="hidden"
                        onChange={handleProfilePictureChange}
                        aria-label="Change profile picture"
                    />
                    <div className="relative shrink-0 group/avatar">
                        <button
                            type="button"
                            onClick={() => setProfilePictureModalOpen(true)}
                            className="relative drop-shadow-lg rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:ring-offset-2 focus:ring-offset-[var(--theme-surface)] cursor-pointer"
                            aria-label="View profile picture"
                        >
                        {hasActiveStory ? (
                            <div className="story-ring story-ring-thin rounded-full inline-flex">
                                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-[var(--theme-surface)] p-1 theme-surface bg-[var(--theme-surface)] overflow-hidden">
                                    <Avatar
                                        src={profile.profile_picture}
                                        alt={profile.name}
                                        size="2xl"
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-[var(--theme-border)] p-1 theme-surface bg-[var(--theme-surface)] overflow-hidden shadow-inner">
                                <Avatar
                                    src={profile.profile_picture}
                                    alt={profile.name}
                                    size="2xl"
                                    className="w-full h-full rounded-full object-cover"
                                />
                            </div>
                        )}
                        {isUpdatingProfilePicture && (
                            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 z-10">
                                <span className="material-symbols-outlined text-3xl text-white animate-spin">progress_activity</span>
                            </div>
                        )}
                        <span
                            className="absolute bottom-1 right-1 md:bottom-2 md:right-2 w-3 h-3 md:w-4 md:h-4 rounded-full bg-emerald-500 border-2 border-[var(--theme-surface)] ring-2 ring-[var(--theme-surface)]"
                            title="Online"
                            aria-hidden
                        />
                        </button>
                        {isOwnProfile && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    profilePicInputRef.current?.click();
                                }}
                                disabled={updateProfileMutation.isPending}
                                className="absolute bottom-0 right-0 p-2 rounded-full bg-[var(--theme-surface)] border-2 border-[var(--theme-border)] text-[var(--text-primary)] shadow-lg hover:bg-[var(--theme-surface-hover)] transition-opacity opacity-0 group-hover/avatar:opacity-100 focus:opacity-100 disabled:opacity-50"
                                aria-label="Change profile picture"
                            >
                                <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                        )}
                    </div>
                    <div className="flex-1 min-w-[7rem] flex flex-col justify-center py-2">
                        <h1 className="text-xl font-semibold text-[var(--text-primary)] leading-tight truncate">
                            {profile.name?.trim() || (profile.username ? profile.username.charAt(0).toUpperCase() + profile.username.slice(1) : 'User')}
                        </h1>
                        {profile.username && (
                            <p className="text-sm text-[var(--text-secondary)] mt-0.5 truncate">@{profile.username}</p>
                        )}
                    </div>
                </div>

                {/* Profile Info Section - bio, location, actions */}
                <div className="pt-4 pb-8 px-6 md:px-8 pr-8 md:pr-12 min-w-0">
                    <div className="flex flex-col gap-5">
                        {/* Bio, location, date - full width */}
                        <div className="min-w-0">
                            {profile.bio && profile.bio.trim().length > 0 ? (
                                <p className="text-[var(--text-secondary)] mb-3 leading-relaxed">{profile.bio}</p>
                            ) : isOwnProfile ? (
                                <button
                                    type="button"
                                    onClick={() => setEditModalOpen(true)}
                                    className="text-slate-500 italic mb-3 inline-block hover:text-[var(--theme-accent)] transition-colors text-left"
                                >
                                    Add a bio to tell people about yourself
                                </button>
                            ) : null}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-secondary)]">
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
                        {/* Action buttons - full width row, wrap with gap */}
                        <div className="flex items-center flex-wrap gap-3 shrink-0">
                            {isOwnProfile ? (
                                <button
                                    type="button"
                                    onClick={() => setEditModalOpen(true)}
                                    className="px-5 py-2.5 border border-[var(--theme-border)] rounded-xl hover:bg-[var(--theme-surface-hover)] font-medium text-[var(--text-primary)] transition-all active:scale-[0.98]"
                                >
                                    Edit Profile
                                </button>
                            ) : (
                                <>
                                    {friendRequestStatus === 'sent' ? (
                                        <div className="flex items-center flex-wrap gap-3">
                                            <span className="px-5 py-2.5 bg-white/10 text-[var(--text-secondary)] rounded-xl font-medium inline-flex items-center gap-2">
                                                <span className="material-symbols-outlined text-lg">hourglass_empty</span>
                                                <span>Request Sent</span>
                                            </span>
                                            <button
                                                onClick={() => cancelFriendRequestMutation.mutate(sentRequest?.id)}
                                                disabled={cancelFriendRequestMutation.isPending || !sentRequest?.id || String(sentRequest?.id).startsWith('temp-')}
                                                className="px-5 py-2.5 border border-[var(--theme-border)] text-[var(--text-primary)] rounded-xl font-medium transition-all hover:bg-[var(--theme-surface-hover)] active:scale-[0.98] inline-flex items-center gap-2 cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-lg">close</span>
                                                <span>Cancel request</span>
                                            </button>
                                        </div>
                                    ) : friendRequestStatus === 'received' ? (
                                        <div className="flex items-center flex-wrap gap-3">
                                            <button
                                                onClick={() => acceptFriendRequestMutation.mutate(receivedRequest?.id)}
                                                disabled={acceptFriendRequestMutation.isPending}
                                                className="px-5 py-2.5 bg-[var(--theme-accent)] text-white rounded-xl font-medium transition-all hover:opacity-90 active:scale-[0.98] inline-flex items-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-lg">check</span>
                                                <span>Accept</span>
                                            </button>
                                            <button
                                                onClick={() => rejectFriendRequestMutation.mutate(receivedRequest?.id)}
                                                disabled={rejectFriendRequestMutation.isPending}
                                                className="px-5 py-2.5 bg-white/10 text-[var(--text-secondary)] rounded-xl font-medium transition-all hover:bg-white/20 active:scale-[0.98] inline-flex items-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-lg">close</span>
                                                <span>Reject</span>
                                            </button>
                                        </div>
                                    ) : isFollowing ? (
                                        <div className="flex items-center flex-wrap gap-3">
                                            <span className="px-5 py-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl font-medium inline-flex items-center gap-2">
                                                <span className="material-symbols-outlined text-lg">check_circle</span>
                                                <span>Connected</span>
                                            </span>
                                            <button
                                                onClick={() => unfollowMutation.mutate(profile.id)}
                                                disabled={unfollowMutation.isPending}
                                                className="px-5 py-2.5 bg-white/10 text-[var(--text-secondary)] rounded-xl font-medium transition-colors hover:bg-white/20 inline-flex items-center gap-2 cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-lg">person_remove</span>
                                                <span>Unfollow</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => followMutation.mutate(profile.id)}
                                            disabled={followMutation.isPending}
                                            className="px-5 py-2.5 bg-[var(--theme-accent)] text-white rounded-xl font-medium transition-all hover:opacity-90 active:scale-[0.98] inline-flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-lg">person_add</span>
                                            <span>Connect</span>
                                        </button>
                                    )}
                                    <Link
                                        to={`/messages/${username}`}
                                        className="px-5 py-2.5 border border-[var(--theme-border)] rounded-xl hover:bg-[var(--theme-surface-hover)] font-medium text-[var(--text-primary)] transition-all active:scale-[0.98] inline-flex items-center gap-2 no-underline"
                                        style={{ borderRadius: '0.75rem' }}
                                    >
                                        <span className="material-symbols-outlined text-lg">mail</span>
                                        <span>Message</span>
                                    </Link>
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

                {/* Profile picture lightbox — Facebook-style: left = image (half), right = panel (comments, share, user) */}
                {profile && profilePictureModalOpen && (
                    <ProfilePictureLightbox
                        profile={profile}
                        isOwnProfile={isOwnProfile}
                        onClose={() => setProfilePictureModalOpen(false)}
                    />
                )}

                <MediaView
                    isOpen={!!selectedMediaPost || !!selectedHistoryImage}
                    onClose={() => {
                        setSelectedMediaPost(null);
                        setSelectedHistoryImage(null);
                    }}
                    post={selectedMediaPost}
                    imageUrl={selectedHistoryImage?.url}
                    title={selectedHistoryImage?.type === 'profile-pictures' ? 'Profile picture' : selectedHistoryImage?.type === 'cover-images' ? 'Cover image' : null}
                    subtitle={selectedHistoryImage ? 'From your media' : null}
                    caption={selectedHistoryImage?.type === 'profile-pictures' ? profile?.profile_picture_caption : selectedHistoryImage?.type === 'cover-images' ? profile?.cover_image_caption : undefined}
                    user={selectedHistoryImage ? profile : undefined}
                    linkedPost={
                        selectedHistoryImage && isOwnProfile
                            ? selectedHistoryImage?.type === 'profile-pictures'
                                ? profile?.latest_profile_picture_post
                                : selectedHistoryImage?.type === 'cover-images'
                                    ? profile?.latest_cover_image_post
                                    : undefined
                            : undefined
                    }
                />

                {/* Caption modal when changing profile picture or cover image */}
                {imageCaptionModal && (
                    <div
                        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Add caption"
                        onClick={closeImageCaptionModal}
                    >
                        <div
                            className="theme-surface rounded-2xl border border-[var(--theme-border)] shadow-2xl max-w-md w-full overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-4 border-b border-[var(--theme-border)] flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                                    {imageCaptionModal.type === 'profile-picture' ? 'New profile picture' : 'New cover image'}
                                </h3>
                                <button
                                    type="button"
                                    onClick={closeImageCaptionModal}
                                    className="p-2 rounded-full hover:bg-[var(--theme-surface-hover)] text-[var(--text-secondary)]"
                                    aria-label="Close"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <div className="p-4 space-y-4">
                                <div className="rounded-xl overflow-hidden border border-[var(--theme-border)] bg-[var(--theme-surface-hover)]">
                                    {imageCaptionModal.type === 'profile-picture' ? (
                                        <img
                                            src={imageCaptionModal.previewUrl}
                                            alt="Preview"
                                            className="w-full aspect-square object-cover"
                                        />
                                    ) : (
                                        <img
                                            src={imageCaptionModal.previewUrl}
                                            alt="Preview"
                                            className="w-full aspect-video object-cover"
                                        />
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                                        Who can see this?
                                    </label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="image-visibility"
                                                value="public"
                                                checked={imageVisibility === 'public'}
                                                onChange={() => setImageVisibility('public')}
                                                className="w-4 h-4 text-[var(--theme-accent)] border-[var(--theme-border)] focus:ring-[var(--theme-accent)]"
                                            />
                                            <span className="text-sm text-[var(--text-primary)]">Public</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="image-visibility"
                                                value="friends"
                                                checked={imageVisibility === 'friends'}
                                                onChange={() => setImageVisibility('friends')}
                                                className="w-4 h-4 text-[var(--theme-accent)] border-[var(--theme-border)] focus:ring-[var(--theme-accent)]"
                                            />
                                            <span className="text-sm text-[var(--text-primary)]">Just for friends</span>
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="image-caption" className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                                        Caption (optional)
                                    </label>
                                    <textarea
                                        id="image-caption"
                                        value={imageCaptionText}
                                        onChange={(e) => setImageCaptionText(e.target.value)}
                                        placeholder="Add a caption..."
                                        rows={3}
                                        maxLength={500}
                                        className="w-full px-3 py-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-hover)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:ring-2 focus:ring-[var(--theme-accent)]/40 focus:border-[var(--theme-accent)] outline-none resize-none text-sm"
                                    />
                                    <p className="text-xs text-[var(--text-secondary)] mt-1">{imageCaptionText.length}/500</p>
                                </div>
                            </div>
                            <div className="p-4 border-t border-[var(--theme-border)] flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={closeImageCaptionModal}
                                    className="px-4 py-2 rounded-xl border border-[var(--theme-border)] text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={submitImageWithCaption}
                                    disabled={updateProfileMutation.isPending}
                                    className="px-4 py-2 rounded-xl bg-[var(--theme-accent)] text-white font-medium hover:opacity-90 disabled:opacity-60"
                                >
                                    {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Profile Navigation Tabs */}
                <div className="border-t border-[var(--theme-border)] px-6 md:px-8 pr-8 md:pr-12 pt-0 pb-4 min-w-0">
                    <div className="flex gap-4 md:gap-6 min-w-0 flex-wrap">
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
            <div className="flex flex-col lg:flex-row gap-6 min-w-0">
                {/* Left Sidebar - About card (only on Posts tab when website/location exist) */}
                {(profile.website || profile.location) && activeTab === 'posts' && (
                <div className="lg:w-1/4 min-w-0 space-y-6 shrink-0">
                    <div className="theme-surface rounded-2xl border border-[var(--theme-border)] p-4 card-shadow transition-all duration-200 hover:shadow-lg hover:shadow-black/10">
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

                {/* Main Content - Tab content */}
                <div className={`${(profile.website || profile.location) && activeTab === 'posts' ? 'lg:w-3/4 min-w-0 flex-1' : 'w-full min-w-0'} space-y-6`}>
                    {/* Posts tab */}
                    {activeTab === 'posts' && (
                        <>
                            {isOwnProfile && (
                                <div className="theme-surface rounded-2xl border border-[var(--theme-border)] p-6 card-shadow transition-all duration-200 hover:shadow-lg hover:shadow-black/10">
                                    <PostInput onPostCreated={refetchPosts} />
                                </div>
                            )}
                            {postsLoading ? (
                                <FeedSkeleton cards={3} showComposer={false} />
                            ) : posts.length > 0 ? (
                                <div className="space-y-6">
                                    {posts.map((post) => (
                                        <PostCard key={post.id} post={post} />
                                    ))}
                                </div>
                            ) : (
                                <div className="theme-surface rounded-2xl border border-[var(--theme-border)] p-12 text-center card-shadow">
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
                        </>
                    )}

                    {/* Media tab - posts, profile pictures, cover images */}
                    {activeTab === 'media' && (
                        <div className="theme-surface rounded-2xl border border-[var(--theme-border)] card-shadow overflow-hidden">
                            {/* Sticky sub-tabs (own profile only) */}
                            {isOwnProfile && (
                                <div className="sticky top-0 z-10 bg-[var(--theme-surface)] border-b border-[var(--theme-border)] px-4 py-2 flex gap-1">
                                    {[
                                        { id: 'posts', label: 'Posts' },
                                        { id: 'profile-pictures', label: 'Profile pictures' },
                                        { id: 'cover-images', label: 'Cover images' },
                                    ].map(({ id, label }) => (
                                        <button
                                            key={id}
                                            type="button"
                                            onClick={() => setMediaSubTab(id)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                mediaSubTab === id
                                                    ? 'bg-[var(--theme-accent)] text-white'
                                                    : 'text-[var(--text-secondary)] hover:bg-[var(--theme-surface-hover)] hover:text-[var(--text-primary)]'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className="p-4 min-h-[200px]">
                                {(mediaSubTab === 'posts' || !isOwnProfile) && (
                                    <>
                                        {postsLoading ? (
                                            <MediaGridSkeleton count={6} />
                                        ) : mediaPosts.length > 0 ? (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                {mediaPosts.map((post) => (
                                                    <button
                                                        key={post.id}
                                                        type="button"
                                                        onClick={() => setSelectedMediaPost(post)}
                                                        className="aspect-square rounded-xl overflow-hidden bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] hover:opacity-90 transition-opacity cursor-pointer p-0 text-left"
                                                    >
                                                        {post.media_type === 'image' ? (
                                                            <img src={post.media_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[var(--text-secondary)]">
                                                                <span className="material-symbols-outlined text-4xl">videocam</span>
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-12 text-center">
                                                <span className="material-symbols-outlined text-4xl text-[var(--text-secondary)]/60 mb-3 block">photo_library</span>
                                                <p className="text-[var(--text-primary)] font-medium">No photos yet</p>
                                                <p className="text-[var(--text-secondary)] text-sm mt-1">Photos from posts will appear here</p>
                                            </div>
                                        )}
                                    </>
                                )}
                                {isOwnProfile && mediaSubTab === 'profile-pictures' && (
                                    <>
                                        {profilePictureHistoryLoading ? (
                                            <MediaGridSkeleton count={6} />
                                        ) : profile?.latest_profile_picture_post || profilePictureHistoryItems.length > 0 ? (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                {profile?.latest_profile_picture_post && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedMediaPost(profile.latest_profile_picture_post);
                                                            setSelectedHistoryImage(null);
                                                        }}
                                                        className="aspect-square rounded-xl overflow-hidden bg-[var(--theme-surface-hover)] border-2 border-[var(--theme-accent)] border-opacity-50 hover:opacity-90 transition-opacity cursor-pointer p-0 text-left relative"
                                                        title="Current profile picture (view & comment)"
                                                    >
                                                        <AuthImage src={profile.latest_profile_picture_post.media_url} alt="" className="w-full h-full object-cover" />
                                                        <span className="absolute bottom-1 left-1 right-1 text-[10px] font-medium text-white bg-black/60 rounded px-1 py-0.5 truncate">Current</span>
                                                    </button>
                                                )}
                                                {profilePictureHistoryItems.map((item, i) => (
                                                    <button
                                                        key={item.url || i}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedHistoryImage({ url: item.url, type: 'profile-pictures' });
                                                            setSelectedMediaPost(null);
                                                        }}
                                                        className="aspect-square rounded-xl overflow-hidden bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] hover:opacity-90 transition-opacity cursor-pointer p-0 text-left"
                                                    >
                                                        <AuthImage src={item.url} alt="" className="w-full h-full object-cover" />
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-12 text-center">
                                                <span className="material-symbols-outlined text-4xl text-[var(--text-secondary)]/60 mb-3 block">portrait</span>
                                                <p className="text-[var(--text-primary)] font-medium">No profile pictures yet</p>
                                                <p className="text-[var(--text-secondary)] text-sm mt-1">Your profile picture history will appear here</p>
                                            </div>
                                        )}
                                    </>
                                )}
                                {isOwnProfile && mediaSubTab === 'cover-images' && (
                                    <>
                                        {coverImageHistoryLoading ? (
                                            <MediaGridSkeleton count={6} aspectClass="aspect-video" />
                                        ) : profile?.latest_cover_image_post || coverImageHistoryItems.length > 0 ? (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                {profile?.latest_cover_image_post && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedMediaPost(profile.latest_cover_image_post);
                                                            setSelectedHistoryImage(null);
                                                        }}
                                                        className="aspect-video rounded-xl overflow-hidden bg-[var(--theme-surface-hover)] border-2 border-[var(--theme-accent)] border-opacity-50 hover:opacity-90 transition-opacity cursor-pointer p-0 text-left relative"
                                                        title="Current cover image (view & comment)"
                                                    >
                                                        <AuthImage src={profile.latest_cover_image_post.media_url} alt="" className="w-full h-full object-cover" />
                                                        <span className="absolute bottom-1 left-1 right-1 text-[10px] font-medium text-white bg-black/60 rounded px-1 py-0.5 truncate">Current</span>
                                                    </button>
                                                )}
                                                {coverImageHistoryItems.map((item, i) => (
                                                    <button
                                                        key={item.url || i}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedHistoryImage({ url: item.url, type: 'cover-images' });
                                                            setSelectedMediaPost(null);
                                                        }}
                                                        className="aspect-video rounded-xl overflow-hidden bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] hover:opacity-90 transition-opacity cursor-pointer p-0 text-left"
                                                    >
                                                        <AuthImage src={item.url} alt="" className="w-full h-full object-cover" />
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-12 text-center">
                                                <span className="material-symbols-outlined text-4xl text-[var(--text-secondary)]/60 mb-3 block">image</span>
                                                <p className="text-[var(--text-primary)] font-medium">No cover images yet</p>
                                                <p className="text-[var(--text-secondary)] text-sm mt-1">Your cover image history will appear here</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Communities tab */}
                    {activeTab === 'communities' && (
                        <>
                            {communitiesLoading ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <SkeletonBlock className="h-24 rounded-2xl" />
                                    <SkeletonBlock className="h-24 rounded-2xl" />
                                </div>
                            ) : communities.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {communities.map((community) => (
                                        <Link
                                            key={community.id}
                                            to={`/communities/${community.id}`}
                                            className="theme-surface rounded-2xl border border-[var(--theme-border)] p-4 card-shadow hover:shadow-lg hover:shadow-black/10 transition-all flex items-center gap-4"
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-[var(--theme-surface-hover)] flex items-center justify-center shrink-0 overflow-hidden">
                                                {community.avatar ? (
                                                    <img src={community.avatar} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="material-symbols-outlined text-[var(--text-secondary)]">group</span>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-semibold text-[var(--text-primary)] truncate">{community.name}</h3>
                                                <p className="text-sm text-[var(--text-secondary)]">{community.members_count ?? 0} members</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="theme-surface rounded-2xl border border-[var(--theme-border)] p-12 text-center card-shadow">
                                    <span className="material-symbols-outlined text-4xl text-[var(--text-secondary)]/60 mb-3 block">group</span>
                                    <p className="text-[var(--text-primary)] font-medium">No communities yet</p>
                                    <p className="text-[var(--text-secondary)] text-sm mt-1">Communities they join will appear here</p>
                                </div>
                            )}
                        </>
                    )}

                    {/* More tab - About (bio, website, location, joined) */}
                    {activeTab === 'more' && (
                        <div className="theme-surface rounded-2xl border border-[var(--theme-border)] p-6 card-shadow">
                            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">About</h2>
                            <div className="space-y-4">
                                {profile.bio && (
                                    <p className="text-[var(--text-secondary)] whitespace-pre-wrap">{profile.bio}</p>
                                )}
                                {profile.website && (
                                    <div className="flex items-start gap-2">
                                        <span className="material-symbols-outlined text-[var(--text-secondary)] text-lg shrink-0">link</span>
                                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-[var(--theme-accent)] hover:underline break-all">
                                            {profile.website}
                                        </a>
                                    </div>
                                )}
                                {profile.location && (
                                    <div className="flex items-start gap-2">
                                        <span className="material-symbols-outlined text-[var(--text-secondary)] text-lg shrink-0">location_on</span>
                                        <span className="text-[var(--text-secondary)]">{profile.location}</span>
                                    </div>
                                )}
                                {profile.created_at && (
                                    <div className="flex items-start gap-2">
                                        <span className="material-symbols-outlined text-[var(--text-secondary)] text-lg shrink-0">calendar_today</span>
                                        <span className="text-[var(--text-secondary)]">{formatJoinDate(profile.created_at)}</span>
                                    </div>
                                )}
                                {!profile.bio && !profile.website && !profile.location && (
                                    <p className="text-[var(--text-secondary)]">No additional info yet.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
