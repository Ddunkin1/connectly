import React from 'react';
import { Link } from 'react-router-dom';
import { formatDateUppercase } from '../../utils/formatDate';
import Avatar from '../common/Avatar';

// ── Type icon badge config ────────────────────────────────────────────────────
const TYPE_BADGE = {
    like:                          { icon: 'favorite',       bg: 'bg-rose-500' },
    comment:                       { icon: 'chat_bubble',    bg: 'bg-blue-500' },
    comment_reply:                 { icon: 'reply',          bg: 'bg-blue-500' },
    comment_like:                  { icon: 'favorite',       bg: 'bg-rose-500' },
    comment_pinned:                { icon: 'push_pin',       bg: 'bg-amber-500' },
    mention:                       { icon: 'alternate_email',bg: 'bg-violet-500' },
    share:                         { icon: 'ios_share',      bg: 'bg-sky-500' },
    friend_request:                { icon: 'person_add',     bg: 'bg-green-500' },
    friend_request_accepted:       { icon: 'check_circle',   bg: 'bg-green-500' },
    community_invite:              { icon: 'group_add',      bg: 'bg-orange-500' },
    community_invite_suggested:    { icon: 'group_add',      bg: 'bg-orange-400' },
    community_member_joined:       { icon: 'groups',         bg: 'bg-teal-500' },
    community_join_request:        { icon: 'person_check',   bg: 'bg-orange-500' },
    community_join_request_approved:{ icon: 'check_circle',  bg: 'bg-green-500' },
    community_join_request_rejected:{ icon: 'cancel',        bg: 'bg-red-500' },
    moderation_warning:            { icon: 'gavel',          bg: 'bg-amber-500' },
    report_outcome:                { icon: 'gavel',          bg: 'bg-amber-500' },
    moderation_content_removed:    { icon: 'delete',         bg: 'bg-red-500' },
    account_suspended:             { icon: 'block',          bg: 'bg-red-500' },
    account_banned:                { icon: 'block',          bg: 'bg-red-600' },
    warning_appeal_submitted:      { icon: 'gavel',          bg: 'bg-violet-500' },
    warning_appeal_answered:       { icon: 'gavel',          bg: 'bg-amber-500' },
    ban_appeal_submitted:          { icon: 'gavel',          bg: 'bg-violet-500' },
    ban_appeal_answered:           { icon: 'gavel',          bg: 'bg-amber-500' },
};

const DEFAULT_BADGE = { icon: 'notifications', bg: 'bg-gray-500' };

const NotificationItem = ({
    notification,
    onMarkAsRead,
    onAcceptCommunityInvite,
    onDeclineCommunityInvite,
    onApproveSuggestedInvite,
    onRejectSuggestedInvite,
    onApproveJoinRequest,
    onRejectJoinRequest,
    onOpenWarning,
}) => {
    const { id, type, data, read_at, created_at } = notification;
    const isUnread = !read_at;

    const badge = TYPE_BADGE[type] ?? DEFAULT_BADGE;

    const actorName            = data.actor_name || data.sender_name || data.inviter_name || data.user_name || 'Someone';
    const actorProfilePicture  = data.actor_profile_picture ?? data.sender_profile_picture ?? data.inviter_profile_picture ?? data.user_profile_picture;
    const likesCount           = data.likes_count ?? 0;
    const isModerationSystem   = [
        'report_outcome', 'moderation_content_removed', 'account_suspended',
        'moderation_warning', 'account_banned', 'warning_appeal_submitted',
        'warning_appeal_answered', 'ban_appeal_submitted', 'ban_appeal_answered',
    ].includes(type);

    const getLink = () => {
        switch (type) {
            case 'report_outcome':                 return '/notifications';
            case 'moderation_warning':
            case 'warning_appeal_answered':        return data.moderation_event_id ? `/warnings/${data.moderation_event_id}` : '/safety';
            case 'warning_appeal_submitted':       return data.appeal_id ? `/admin/warning-appeals?appeal=${data.appeal_id}` : '/admin/warning-appeals';
            case 'ban_appeal_submitted':           return data.appeal_id ? `/admin/ban-appeals?appeal=${data.appeal_id}` : '/admin/ban-appeals';
            case 'moderation_content_removed':
            case 'account_suspended':
            case 'account_banned':
            case 'ban_appeal_answered':            return '/safety';
            case 'friend_request':                 return `/profile/${data.sender_username}`;
            case 'friend_request_accepted':        return `/profile/${data.actor_username}`;
            case 'like':
            case 'comment':
            case 'mention':
            case 'share':
            case 'comment_like':
            case 'comment_pinned':
            case 'comment_reply':                  return `/post/${data.post_id}`;
            case 'community_invite':
            case 'community_invite_suggested':
            case 'community_member_joined':
            case 'community_join_request':
            case 'community_join_request_approved':
            case 'community_join_request_rejected':return data.community_id ? `/communities/${data.community_id}` : '#';
            default:                               return '#';
        }
    };

    const getMessage = () => {
        if (isModerationSystem) return data.message || 'Update from moderation';
        if (type === 'like' && likesCount > 1)
            return `liked your post along with ${likesCount - 1} ${likesCount - 1 === 1 ? 'other' : 'others'}`;
        switch (type) {
            case 'like':                            return 'liked your post';
            case 'comment':                         return 'commented on your post';
            case 'comment_like':                    return 'liked your comment';
            case 'comment_pinned':                  return 'pinned your comment';
            case 'comment_reply':                   return 'replied to your comment';
            case 'share':                           return 'shared your post';
            case 'mention':                         return data.context === 'comment' ? 'mentioned you in a comment' : 'mentioned you in a post';
            case 'friend_request':                  return 'sent you a friend request';
            case 'friend_request_accepted':         return 'accepted your friend request';
            case 'community_invite':                return `invited you to join ${data.community_name || 'a community'}`;
            case 'community_invite_suggested':      return data.message || `suggested inviting someone to ${data.community_name || 'the community'}`;
            case 'community_member_joined':         return data.message || `joined ${data.community_name || 'your community'}`;
            case 'community_join_request':          return data.message || `requested to join ${data.community_name || 'the community'}`;
            case 'community_join_request_approved': return data.message || `Your request to join ${data.community_name || 'the community'} was approved`;
            case 'community_join_request_rejected': return data.message || `Your request to join ${data.community_name || 'the community'} was declined`;
            default:                                return '';
        }
    };

    const hasActions = (type === 'community_invite' && data.community_id && data.community_invite_id)
        || (type === 'community_invite_suggested' && data.community_id && data.community_invite_id)
        || (type === 'community_join_request' && data.community_id && data.join_request_id);

    const hasThumbnail = !isModerationSystem && data.media_url && data.media_type === 'image';
    const hasPreviewText = !isModerationSystem && !hasActions
        && (data.comment_preview || (type !== 'like' && data.post_preview));

    const handleClick = () => { if (isUnread && onMarkAsRead) onMarkAsRead(id); };

    const inner = (
        <div
            onClick={handleClick}
            className={`relative flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--theme-surface-hover)] ${isUnread ? 'bg-[var(--theme-accent)]/[0.04]' : ''}`}
        >
            {/* Unread dot */}
            {isUnread && (
                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[var(--theme-accent)]" />
            )}

            {/* Avatar + type badge */}
            <div className="relative shrink-0">
                {isModerationSystem ? (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${badge.bg}`}>
                        <span className="material-symbols-outlined text-white text-[18px]">{badge.icon}</span>
                    </div>
                ) : (
                    <>
                        <Avatar
                            src={actorProfilePicture}
                            alt={actorName}
                            size="md"
                            className="w-10 h-10 rounded-full"
                        />
                        <span className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-[var(--theme-surface)] ${badge.bg}`}>
                            <span className="material-symbols-outlined text-white leading-none" style={{ fontSize: 11 }}>{badge.icon}</span>
                        </span>
                    </>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                {/* Main message */}
                <p className="text-sm text-[var(--text-primary)] leading-snug">
                    {!isModerationSystem && (
                        <span className="font-semibold">{actorName} </span>
                    )}
                    <span className="text-[var(--text-primary)]">{getMessage()}</span>
                </p>

                {/* Secondary preview text (comment text, post preview) */}
                {hasPreviewText && (
                    <p className="mt-0.5 text-xs text-[var(--text-secondary)] line-clamp-1">
                        {data.comment_preview || data.post_preview}
                    </p>
                )}

                {/* Moderation extra detail */}
                {isModerationSystem && data.detail && (
                    <p className="mt-0.5 text-xs text-[var(--text-secondary)] line-clamp-2">{data.detail}</p>
                )}

                {/* Timestamp */}
                <p className="mt-1 text-[11px] text-[var(--text-secondary)]">{formatDateUppercase(created_at)}</p>

                {/* Action buttons (community invite / join request) */}
                {hasActions && (
                    <div className="flex items-center gap-2 mt-2.5" onClick={(e) => e.stopPropagation()}>
                        {type === 'community_invite' && (
                            <>
                                <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); onDeclineCommunityInvite(data.community_id, data.community_invite_id); }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--theme-border)] text-[var(--text-secondary)] hover:bg-[var(--theme-surface-hover)] transition-colors"
                                >Decline</button>
                                <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); onAcceptCommunityInvite(data.community_id, data.community_invite_id); }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--theme-accent)] text-white hover:opacity-90 transition-opacity"
                                >Accept</button>
                            </>
                        )}
                        {type === 'community_invite_suggested' && (
                            <>
                                <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); onRejectSuggestedInvite(data.community_id, data.community_invite_id); }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--theme-border)] text-[var(--text-secondary)] hover:bg-[var(--theme-surface-hover)] transition-colors"
                                >Reject</button>
                                <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); onApproveSuggestedInvite(data.community_id, data.community_invite_id); }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--theme-accent)] text-white hover:opacity-90 transition-opacity"
                                >Approve</button>
                            </>
                        )}
                        {type === 'community_join_request' && (
                            <>
                                <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); onRejectJoinRequest(data.community_id, data.join_request_id); }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--theme-border)] text-[var(--text-secondary)] hover:bg-[var(--theme-surface-hover)] transition-colors"
                                >Reject</button>
                                <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); onApproveJoinRequest(data.community_id, data.join_request_id); }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--theme-accent)] text-white hover:opacity-90 transition-opacity"
                                >Approve</button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Media thumbnail */}
            {hasThumbnail && (
                <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-[var(--theme-surface-hover)]">
                    <img src={data.media_url} alt="" className="w-full h-full object-cover" />
                </div>
            )}
        </div>
    );

    // Moderation warning opens a modal
    if (onOpenWarning && data?.moderation_event_id && (type === 'moderation_warning' || type === 'warning_appeal_answered')) {
        return (
            <button type="button" className="block w-full text-left" onClick={() => { handleClick(); onOpenWarning(data.moderation_event_id); }}>
                {inner}
            </button>
        );
    }

    return <Link to={getLink()} className="block">{inner}</Link>;
};

export default NotificationItem;
