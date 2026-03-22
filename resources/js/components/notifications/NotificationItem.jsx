import React from 'react';
import { Link } from 'react-router-dom';
import { formatDateUppercase } from '../../utils/formatDate';
import { UilHeart, UilComment, UilShare, UilBookmark } from '../common/Icons';
import Avatar from '../common/Avatar';

const NotificationItem = ({
    notification,
    onMarkAsRead,
    onAcceptCommunityInvite,
    onDeclineCommunityInvite,
    onApproveSuggestedInvite,
    onRejectSuggestedInvite,
    onApproveJoinRequest,
    onRejectJoinRequest,
}) => {
    const { id, type, data, read_at, created_at } = notification;
    const isUnread = !read_at;

    const getLink = () => {
        switch (type) {
            case 'report_outcome':
                return '/notifications';
            case 'moderation_warning':
                return data.moderation_event_id ? `/warnings/${data.moderation_event_id}` : '/safety';
            case 'warning_appeal_answered':
                return data.moderation_event_id ? `/warnings/${data.moderation_event_id}` : '/safety';
            case 'warning_appeal_submitted':
                return data.appeal_id ? `/admin/warning-appeals?appeal=${data.appeal_id}` : '/admin/warning-appeals';
            case 'moderation_content_removed':
            case 'account_suspended':
            case 'account_banned':
                return '/safety';
            case 'friend_request':
                return `/profile/${data.sender_username}`;
            case 'friend_request_accepted':
                return `/profile/${data.actor_username}`;
            case 'like':
            case 'comment':
            case 'mention':
            case 'share':
            case 'comment_like':
            case 'comment_pinned':
            case 'comment_reply':
                return `/post/${data.post_id}`;
            case 'community_invite':
            case 'community_invite_suggested':
            case 'community_member_joined':
            case 'community_join_request':
            case 'community_join_request_approved':
            case 'community_join_request_rejected':
                return data.community_id ? `/communities/${data.community_id}` : '#';
            default:
                return '#';
        }
    };

    const showPostButton = () => {
        if (['friend_request_accepted'].includes(type)) return true;
        return ['like', 'comment', 'mention', 'share', 'comment_like', 'comment_pinned', 'comment_reply'].includes(type) && data.post_id;
    };

    const actorName = data.actor_name || data.sender_name || data.inviter_name || data.user_name;
    const actorProfilePicture = data.actor_profile_picture ?? data.sender_profile_picture ?? data.inviter_profile_picture ?? data.user_profile_picture;
    const isFriendRequestType = type === 'friend_request' || type === 'friend_request_accepted';
    const isCommunityType = ['community_invite', 'community_invite_suggested', 'community_member_joined', 'community_join_request', 'community_join_request_approved', 'community_join_request_rejected'].includes(type);

    const likesCount = data.likes_count ?? 0;
    const commentsCount = data.comments_count ?? 0;
    const hasPostPreview = data.media_url || (likesCount > 0 && (type === 'like' || type === 'share')) || ((type === 'like' || type === 'share') && data.post_preview) || ((type === 'comment_like' || type === 'comment_pinned' || type === 'comment_reply') && (data.comment_preview || data.post_preview));

    const handleClick = () => {
        if (isUnread && onMarkAsRead) {
            onMarkAsRead(id);
        }
    };

    const isModerationSystem = [
        'report_outcome',
        'moderation_content_removed',
        'account_suspended',
        'moderation_warning',
        'account_banned',
        'warning_appeal_submitted',
        'warning_appeal_answered',
    ].includes(type);

    if (isModerationSystem) {
        const moderationContent = (
            <div
                className={`flex flex-col gap-2 p-3 hover:bg-[var(--theme-surface-hover)] transition-colors ${
                    isUnread ? 'bg-[var(--theme-accent)]/5' : ''
                }`}
                onClick={handleClick}
            >
                <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[var(--theme-accent)] shrink-0 text-[22px] leading-none mt-0.5">
                        gavel
                    </span>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--text-primary)] leading-snug">{data.message || 'Update from moderation'}</p>
                        {data.reason_label && (
                            <p className="text-xs font-medium text-[var(--text-primary)] mt-1">
                                Reason: {data.reason_label}
                            </p>
                        )}
                        {data.detail && (
                            <p
                                className={`text-xs text-[var(--text-secondary)] mt-1 leading-relaxed ${
                                    type === 'moderation_warning' || type === 'warning_appeal_answered'
                                        ? 'line-clamp-3'
                                        : ''
                                }`}
                            >
                                {data.detail}
                            </p>
                        )}
                        {type === 'moderation_warning' && (data.post_preview || data.post_media_url) && (
                            <div className="flex gap-2 mt-2 rounded-lg overflow-hidden border border-[var(--theme-border)] bg-[var(--theme-surface)]">
                                {data.post_media_url && (
                                    <div className="w-14 h-14 shrink-0 bg-black/10">
                                        <img
                                            src={data.post_media_url}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <div className="min-w-0 py-1.5 pr-2 flex-1">
                                    {data.post_preview && (
                                        <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{data.post_preview}</p>
                                    )}
                                    <p className="text-[11px] text-[var(--theme-accent)] mt-1 font-medium">
                                        Review post · delete · appeal
                                    </p>
                                </div>
                            </div>
                        )}
                        {type === 'moderation_warning' && !data.post_preview && !data.post_media_url && (
                            <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                                Tap to view details and submit an appeal if you disagree.
                            </p>
                        )}
                        {type === 'warning_appeal_submitted' && data.appeal_preview && (
                            <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed line-clamp-3">
                                {data.appeal_preview}
                            </p>
                        )}
                        {type === 'warning_appeal_submitted' && data.username && (
                            <p className="text-[11px] text-[var(--text-secondary)] mt-1">@{data.username}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5 pl-[34px]">
                    <span className="text-[11px] text-[var(--text-secondary)] uppercase tracking-wide">
                        {formatDateUppercase(created_at)}
                    </span>
                    <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            type === 'warning_appeal_submitted'
                                ? 'bg-violet-500/15 text-violet-700 dark:text-violet-400'
                                : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                        }`}
                    >
                        {type === 'warning_appeal_submitted' ? 'Appeal' : 'Safety'}
                    </span>
                </div>
            </div>
        );

        return (
            <Link to={getLink()} className="block">
                {moderationContent}
            </Link>
        );
    }

    const hasActions = (type === 'community_invite' && onAcceptCommunityInvite && onDeclineCommunityInvite) ||
        (type === 'community_invite_suggested' && onApproveSuggestedInvite && onRejectSuggestedInvite) ||
        (type === 'community_join_request' && onApproveJoinRequest && onRejectJoinRequest);
    const actionBtnClass = 'px-2 py-1 rounded-md text-xs font-medium transition-colors';

    const content = (
        <div
            className={`flex flex-col gap-2 p-3 hover:bg-[var(--theme-surface-hover)] transition-colors ${
                isUnread ? 'bg-[var(--theme-accent)]/5' : ''
            }`}
            onClick={handleClick}
        >
            {/* Row 1: Avatar + message only */}
            <div className="flex items-start gap-3">
                {(isFriendRequestType || isCommunityType) && (
                    <div className="shrink-0">
                        <Avatar src={actorProfilePicture} alt={actorName} size="md" className="w-10 h-10 rounded-full" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-primary)] leading-snug">
                        {type === 'like' && likesCount > 1 ? (
                            <>
                                Liked by <span className="font-semibold">{actorName}</span> and{' '}
                                <span className="font-semibold">{likesCount - 1} others</span>
                            </>
                        ) : (
                            <>
                                <span className="font-semibold">{actorName || 'Someone'}</span>{' '}
                                <span className="text-[var(--text-secondary)]">
                                    {type === 'friend_request' && 'sent you a friend request'}
                                    {type === 'friend_request_accepted' && 'accepted your friend request'}
                                    {type === 'like' && likesCount <= 1 && 'liked your post'}
                                    {type === 'comment' && 'commented on your post'}
                                    {type === 'comment_like' && 'liked your comment'}
                                    {type === 'comment_pinned' && 'pinned your comment'}
                                    {type === 'comment_reply' && 'replied to your comment'}
                                    {type === 'share' && 'shared your post'}
                                    {type === 'mention' && (data.context === 'comment' ? 'mentioned you in a comment' : 'mentioned you in a post')}
                                    {type === 'community_invite' && `invited you to join ${data.community_name || 'a community'}`}
                                    {type === 'community_invite_suggested' && (data.message || `suggested inviting someone to ${data.community_name || 'the community'}`)}
                                    {type === 'community_member_joined' && (data.message || `joined ${data.community_name || 'your community'}`)}
                                    {type === 'community_join_request' && (data.message || `${data.user_name || 'Someone'} requested to join ${data.community_name || 'the community'}`)}
                                    {type === 'community_join_request_approved' && (data.message || `You can now join ${data.community_name || 'the community'}`)}
                                    {type === 'community_join_request_rejected' && (data.message || `Your request to join ${data.community_name || 'the community'} was declined`)}
                                </span>
                            </>
                        )}
                    </p>
                </div>
            </div>

            {/* Row 2: Timestamp + compact actions / pills */}
            <div className={`flex items-center justify-between gap-2 flex-wrap pt-0.5 ${(isFriendRequestType || isCommunityType) ? 'pl-[52px]' : ''}`}>
                <span className="text-[11px] text-[var(--text-secondary)] uppercase tracking-wide">{formatDateUppercase(created_at)}</span>
                <div className="flex items-center gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
                    {showPostButton() && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--theme-accent)] text-white">
                            Post
                        </span>
                    )}
                    {(type === 'community_member_joined' || type === 'community_join_request_approved' || type === 'community_join_request_rejected') && data.community_id && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--theme-accent)]/15 text-[var(--theme-accent)]">
                            Community
                        </span>
                    )}
                    {type === 'community_invite' && data.community_id && data.community_invite_id && onAcceptCommunityInvite && onDeclineCommunityInvite && (
                        <>
                            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeclineCommunityInvite(data.community_id, data.community_invite_id); }} className={`${actionBtnClass} border border-[var(--theme-border)] text-[var(--text-secondary)] hover:bg-[var(--theme-surface-hover)]`}>Decline</button>
                            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAcceptCommunityInvite(data.community_id, data.community_invite_id); }} className={`${actionBtnClass} bg-[var(--theme-accent)] text-white hover:opacity-90`}>Accept</button>
                        </>
                    )}
                    {type === 'community_invite_suggested' && data.community_id && data.community_invite_id && onApproveSuggestedInvite && onRejectSuggestedInvite && (
                        <>
                            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRejectSuggestedInvite(data.community_id, data.community_invite_id); }} className={`${actionBtnClass} border border-[var(--theme-border)] text-[var(--text-secondary)] hover:bg-[var(--theme-surface-hover)]`}>Reject</button>
                            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onApproveSuggestedInvite(data.community_id, data.community_invite_id); }} className={`${actionBtnClass} bg-[var(--theme-accent)] text-white hover:opacity-90`}>Approve</button>
                        </>
                    )}
                    {type === 'community_join_request' && data.community_id && data.join_request_id && onApproveJoinRequest && onRejectJoinRequest && (
                        <>
                            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRejectJoinRequest(data.community_id, data.join_request_id); }} className={`${actionBtnClass} border border-[var(--theme-border)] text-[var(--text-secondary)] hover:bg-[var(--theme-surface-hover)]`}>Reject</button>
                            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onApproveJoinRequest(data.community_id, data.join_request_id); }} className={`${actionBtnClass} bg-[var(--theme-accent)] text-white hover:opacity-90`}>Approve</button>
                        </>
                    )}
                </div>
            </div>

            {/* Full post preview - for like/comment notifications with media or engagement */}
            {hasPostPreview && data.post_id && (data.media_url || data.post_preview || data.comment_preview) && (
                <div className="block rounded-xl border border-[var(--theme-border)] overflow-hidden bg-[var(--theme-surface)] mt-1">
                    {data.media_url && (
                        <div className="aspect-video w-full bg-[var(--theme-surface-hover)]">
                            {data.media_type === 'image' ? (
                                <img
                                    src={data.media_url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <video
                                    src={data.media_url}
                                    className="w-full h-full object-cover"
                                    muted
                                    playsInline
                                />
                            )}
                        </div>
                    )}
                    <div className="p-3">
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-4">
                                <button type="button" className="text-gray-400 hover:text-red-500 transition-colors">
                                    <UilHeart size={20} color="currentColor" />
                                </button>
                                <button type="button" className="text-gray-400 hover:text-[var(--theme-accent)] transition-colors">
                                    <UilComment size={20} color="currentColor" />
                                </button>
                                <button type="button" className="text-gray-400 hover:text-white transition-colors">
                                    <UilShare size={20} color="currentColor" />
                                </button>
                            </div>
                            <button type="button" className="text-gray-400 hover:text-white transition-colors ml-auto">
                                <UilBookmark size={20} color="currentColor" />
                            </button>
                        </div>
                        {likesCount > 0 && (
                            <p className="text-xs text-[var(--text-secondary)] mb-1">
                                Liked by {actorName}
                                {likesCount > 1 && ` and ${likesCount - 1} others`}
                            </p>
                        )}
                        {(data.post_preview || data.comment_preview) && (
                            <p className="text-sm text-[var(--text-primary)] line-clamp-2">{data.comment_preview || data.post_preview}</p>
                        )}
                        {commentsCount > 0 && (
                            <p className="text-xs text-[var(--text-secondary)] mt-1">
                                View all {commentsCount} comment{commentsCount !== 1 ? 's' : ''}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <Link to={getLink()} className="block">
            {content}
        </Link>
    );
};

export default NotificationItem;
